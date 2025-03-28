const Contact = require('../models/Contact');
const contactMailService = require('../services/contactMailService');

// İletişim formu gönderimi
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Yeni iletişim kaydı oluştur
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message
    });

    try {
      // Yöneticiye bildirim e-postası gönder
      await contactMailService.sendAdminNotification(contact);
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
      // Continue with the response even if email fails
    }

    try {
      // Kullanıcıya otomatik yanıt e-postası gönder
      await contactMailService.sendUserAutoReply(contact);
    } catch (emailError) {
      console.error('Error sending user auto-reply:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'İletişim formunuz başarıyla gönderildi',
      data: contact
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Tüm iletişim formlarını getir (admin için)
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// İletişim formu durumunu güncelle (admin için)
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'İletişim formu bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// İletişim formunu sil (admin için)
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'İletişim formu bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'İletişim formu başarıyla silindi'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// İletişim formuna yanıt gönder (admin için)
exports.sendReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'İletişim formu bulunamadı'
      });
    }

    // Kullanıcıya yanıt e-postası gönder
    await contactMailService.sendUserReply(contact, reply);

    // İletişim formu durumunu güncelle
    contact.status = 'replied';
    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Yanıt başarıyla gönderildi'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}; 