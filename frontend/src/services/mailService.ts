import api from './api';

interface MailResponse {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  failedEmails?: string[];
}

interface MailToUsersParams {
  userIds: string[];
  subject: string;
  content: string;
  attachments?: any[];
}

interface MailToRolesParams {
  roles: string[];
  subject: string;
  content: string;
  attachments?: any[];
}

interface MailToDepartmentsParams {
  departments: string[];
  subject: string;
  content: string;
  attachments?: any[];
}

interface MailByFilterParams {
  filter: string;
  subject: string;
  content: string;
  attachments?: any[];
}

const mailService = {
  sendMailToUsers: async (params: MailToUsersParams): Promise<MailResponse> => {
    const response = await api.post('/mail/users', params);
    return response.data;
  },

  sendMailToAll: async (params: Omit<MailToUsersParams, 'userIds'>): Promise<MailResponse> => {
    const response = await api.post('/mail/all', params);
    return response.data;
  },

  sendMailToRoles: async (params: MailToRolesParams): Promise<MailResponse> => {
    const response = await api.post('/mail/roles', params);
    return response.data;
  },

  sendMailToDepartments: async (params: MailToDepartmentsParams): Promise<MailResponse> => {
    const response = await api.post('/mail/departments', params);
    return response.data;
  },

  sendMailByFilter: async (params: MailByFilterParams): Promise<MailResponse> => {
    const response = await api.post('/mail/filter', params);
    return response.data;
  }
};

export default mailService;