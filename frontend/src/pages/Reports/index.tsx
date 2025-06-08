import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Spin,
  Alert,
  Tabs,
  Statistic,
  Table,
  Tag,
  Progress,
  Badge,
  message,
  Modal,
  Dropdown,
  MenuProps,
  App,
  Grid
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  DashboardOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import reportsService from '@/services/reportsService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLiveData } from '@/contexts/LiveDataContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;
const { useApp } = App;
const { useBreakpoint } = Grid;

interface Machine {
  _id: string;
  name: string;
  code: string;
  type: string;
  department?: {
    name: string;
  };
}

interface ReportData {
  machine?: any;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  performance?: any;
  trends?: any[];
  anomalies?: any[];
}

interface FactoryReportData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  overall: any;
  machinePerformance: any[];
  shiftPerformance: any[];
}

const Reports: React.FC = () => {
  const { message } = useApp();
  const { isWebSocketConnected } = useLiveData();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [machineReport, setMachineReport] = useState<ReportData | null>(null);
  const [factoryReport, setFactoryReport] = useState<FactoryReportData | null>(null);
  const [anomalyReport, setAnomalyReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('machine');
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Use Ant Design's responsive breakpoints
  const screens = useBreakpoint();

  // Load machines on component mount
  useEffect(() => {
    loadMachines();
  }, []);

  // Auto-generate reports when dependencies change
  useEffect(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    if (activeTab === 'machine' && selectedMachine) {
      generateMachineReport();
    }
  }, [selectedMachine, dateRange, activeTab]);

  useEffect(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    if (activeTab === 'factory') {
      generateFactoryReport();
    }
  }, [dateRange, activeTab]);

  useEffect(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    if (activeTab === 'anomalies') {
      generateAnomalyReport();
    }
  }, [dateRange, activeTab]);

  const loadMachines = async () => {
    try {
      const machines = await reportsService.getMachines();
      setMachines(machines);
      if (machines.length > 0 && !selectedMachine) {
        setSelectedMachine(machines[0]._id);
      }
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const generateMachineReport = async () => {
    if (!selectedMachine || !dateRange) return;

    setLoading(true);
    try {
      const [start, end] = dateRange;
      const report = await reportsService.getMachinePerformanceReport(
        selectedMachine,
        start.toISOString(),
        end.toISOString()
      );
      setMachineReport(report);
    } catch (error) {
      console.error('Error generating machine report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFactoryReport = async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const [start, end] = dateRange;
      const report = await reportsService.getFactoryPerformanceReport(
        start.toISOString(),
        end.toISOString()
      );
      setFactoryReport(report);
    } catch (error) {
      console.error('Error generating factory report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnomalyReport = async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const [start, end] = dateRange;
      const report = await reportsService.getAnomalyReport(
        start.toISOString(),
        end.toISOString()
      );
      setAnomalyReport(report);
    } catch (error) {
      console.error('Error generating anomaly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // useEffect'ler otomatik olarak raporları güncelleyecek
  };

  const downloadReport = (format: 'pdf' | 'excel' | 'csv') => {
    let data: any = null;
    let filename = '';
    
    if (activeTab === 'machine' && machineReport) {
      data = machineReport;
      const machineName = machines.find(m => m._id === selectedMachine)?.name || 'Machine';
      filename = `${machineName}_Report_${format}`;
    } else if (activeTab === 'factory' && factoryReport) {
      data = factoryReport;
      filename = `Factory_Report_${format}`;
    } else if (activeTab === 'anomalies' && anomalyReport) {
      data = anomalyReport;
      filename = `Anomaly_Report_${format}`;
    }

    if (!data) {
      message.warning('İndirilecek rapor bulunamadı. Önce rapor oluşturun.');
      return;
    }

    try {
      if (format === 'csv') {
        downloadAsCSV(data, filename);
      } else if (format === 'excel') {
        downloadAsExcel(data, filename);
      } else if (format === 'pdf') {
        downloadAsPDF(data, filename);
      }
      message.success(`Rapor ${format.toUpperCase()} formatında indirildi`);
    } catch (error) {
      console.error('Download error:', error);
      message.error('Rapor indirilemedi');
    }
  };

  const downloadAsCSV = (data: any, filename: string) => {
    let csvContent = '';
    
    if (activeTab === 'machine') {
      csvContent = convertMachineReportToCSV(data);
    } else if (activeTab === 'factory') {
      csvContent = convertFactoryReportToCSV(data);
    } else if (activeTab === 'anomalies') {
      csvContent = convertAnomalyReportToCSV(data);
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsExcel = (data: any, filename: string) => {
    let csvContent = '';
    if (activeTab === 'machine') {
      csvContent = convertMachineReportToCSV(data);
    } else if (activeTab === 'factory') {
      csvContent = convertFactoryReportToCSV(data);
    } else if (activeTab === 'anomalies') {
      csvContent = convertAnomalyReportToCSV(data);
    } else {
      csvContent = JSON.stringify(data, null, 2);
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsPDF = (data: any, filename: string) => {
    let textContent = '';
    if (activeTab === 'machine') {
      textContent = formatMachineReportForPDF(data);
    } else if (activeTab === 'factory') {
      textContent = formatFactoryReportForPDF(data);
    } else if (activeTab === 'anomalies') {
      textContent = formatAnomalyReportForPDF(data);
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${filename}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #262626; line-height: 1.6; }
            .header { border-bottom: 2px solid #1677ff; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .header h1 { color: #1677ff; font-size: 22px; margin: 0; }
            .date { color: #8c8c8c; font-size: 13px; }
            pre { font-family: inherit; white-space: pre-wrap; font-size: 14px; background: #fafafa; border: 1px solid #f0f0f0; padding: 24px; border-radius: 8px; line-height: 1.8; }
            @media print {
              body { padding: 15mm; }
              pre { border: none; background: transparent; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MES Üretim Sistemi - Resmi Rapor Belgesi</h1>
            <div class="date">${new Date().toLocaleString('tr-TR')}</div>
          </div>
          <pre>${textContent}</pre>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const convertMachineReportToCSV = (data: any) => {
    let csv = 'Makine Raporu\n';
    csv += `Makine,${data.machine?.name || ''}\n`;
    csv += `Kod,${data.machine?.code || ''}\n`;
    csv += `Tür,${data.machine?.type || ''}\n`;
    csv += `Departman,${data.machine?.department || ''}\n\n`;
    
    csv += 'Performans Metrikleri\n';
    csv += `Ortalama Sıcaklık,${data.performance?.avgTemperature?.toFixed(2) || 0} °C\n`;
    csv += `Maksimum Sıcaklık,${data.performance?.maxTemperature?.toFixed(2) || 0} °C\n`;
    csv += `Minimum Sıcaklık,${data.performance?.minTemperature?.toFixed(2) || 0} °C\n`;
    csv += `Ortalama RPM,${data.performance?.avgRpm?.toFixed(0) || 0}\n`;
    csv += `Ortalama Güç,${data.performance?.avgPower?.toFixed(2) || 0} kW\n`;
    csv += `Ortalama Döngü Süresi,${data.performance?.avgCycleTime?.toFixed(2) || 0} sn\n`;
    csv += `Toplam Üretim,${data.performance?.totalProduced || 0}\n`;
    csv += `Reddedilen,${data.performance?.totalRejected || 0}\n`;
    csv += `Çalışma Oranı,${data.performance?.uptimePercentage?.toFixed(1) || 0}%\n`;
    csv += `Red Oranı,${data.performance?.rejectionRate?.toFixed(1) || 0}%\n\n`;
    
    if (data.trends && data.trends.length > 0) {
      csv += 'Trend Verileri\n';
      csv += 'Tarih,Ortalama Sıcaklık,Ortalama RPM,Ortalama Güç,Ortalama Döngü Süresi,Toplam Üretim\n';
      data.trends.forEach((trend: any) => {
        csv += `${trend._id},${trend.avgTemperature?.toFixed(2) || 0},${trend.avgRpm?.toFixed(0) || 0},${trend.avgPower?.toFixed(2) || 0},${trend.avgCycleTime?.toFixed(2) || 0},${trend.totalProduced || 0}\n`;
      });
    }
    
    return csv;
  };

  const convertFactoryReportToCSV = (data: any) => {
    let csv = 'Fabrika Raporu\n\n';
    
    csv += 'Genel Metrikler\n';
    csv += `Toplam Makine,${data.overall?.machineCount || 0}\n`;
    csv += `Ortalama Sıcaklık,${data.overall?.avgTemperature?.toFixed(2) || 0} °C\n`;
    csv += `Maksimum Sıcaklık,${data.overall?.maxTemperature?.toFixed(2) || 0} °C\n`;
    csv += `Ortalama Güç,${data.overall?.avgPower?.toFixed(2) || 0} kW\n`;
    csv += `Toplam Üretim,${data.overall?.totalProduced || 0}\n`;
    csv += `Toplam Red,${data.overall?.totalRejected || 0}\n`;
    csv += `Genel Çalışma Oranı,${data.overall?.overallUptime?.toFixed(1) || 0}%\n`;
    csv += `Ortalama OEE,${data.overall?.avgOee?.toFixed(1) || 0}%\n`;
    csv += `Red Oranı,${data.overall?.rejectionRate?.toFixed(1) || 0}%\n\n`;
    
    if (data.machinePerformance && data.machinePerformance.length > 0) {
      csv += 'Makine Performansı\n';
      csv += 'Makine,Tür,Ortalama Sıcaklık,Ortalama Güç,Toplam Üretim,Toplam Red,Ortalama OEE,Çalışma Oranı,Red Oranı\n';
      data.machinePerformance.forEach((machine: any) => {
        csv += `${machine._id?.machineName || ''},${machine._id?.machineType || ''},${machine.avgTemperature?.toFixed(2) || 0},${machine.avgPower?.toFixed(2) || 0},${machine.totalProduced || 0},${machine.totalRejected || 0},${machine.avgOee?.toFixed(1) || 0},${machine.uptimePercentage?.toFixed(1) || 0},${machine.rejectionRate?.toFixed(1) || 0}\n`;
      });
    }
    
    return csv;
  };

  const convertAnomalyReportToCSV = (data: any) => {
    let csv = 'Anomali Raporu\n\n';
    
    if (data.summary && data.summary.length > 0) {
      csv += 'Anomali Özeti\n';
      csv += 'Şiddet,Toplam\n';
      data.summary.forEach((item: any) => {
        csv += `${item._id},${item.count}\n`;
      });
      csv += '\n';
    }
    
    if (data.anomalies && data.anomalies.length > 0) {
      csv += 'Makine Bazlı Anomaliler\n';
      csv += 'Makine,Toplam Anomali,Anomali Türleri\n';
      data.anomalies.forEach((anomaly: any) => {
        const types = anomaly.anomalies?.map((a: any) => `${a.type}: ${a.count}`).join('; ') || '';
        csv += `${anomaly._id?.machineName || ''},${anomaly.totalAnomalies || 0},"${types}"\n`;
      });
    }
    
    return csv;
  };

  const formatMachineReportForPDF = (data: any) => {
    let content = `MAKİNE RAPORU\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Makine: ${data.machine?.name || ''}\n`;
    content += `Kod: ${data.machine?.code || ''}\n`;
    content += `Tür: ${data.machine?.type || ''}\n`;
    content += `Departman: ${data.machine?.department || ''}\n\n`;
    
    content += `PERFORMANS METRİKLERİ\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `Ortalama Sıcaklık: ${data.performance?.avgTemperature?.toFixed(2) || 0} °C\n`;
    content += `Maksimum Sıcaklık: ${data.performance?.maxTemperature?.toFixed(2) || 0} °C\n`;
    content += `Minimum Sıcaklık: ${data.performance?.minTemperature?.toFixed(2) || 0} °C\n`;
    content += `Ortalama RPM: ${data.performance?.avgRpm?.toFixed(0) || 0}\n`;
    content += `Ortalama Güç: ${data.performance?.avgPower?.toFixed(2) || 0} kW\n`;
    content += `Ortalama Döngü Süresi: ${data.performance?.avgCycleTime?.toFixed(2) || 0} saniye\n`;
    content += `Toplam Üretim: ${data.performance?.totalProduced || 0}\n`;
    content += `Reddedilen: ${data.performance?.totalRejected || 0}\n`;
    content += `Çalışma Oranı: ${data.performance?.uptimePercentage?.toFixed(1) || 0}%\n`;
    content += `Red Oranı: ${data.performance?.rejectionRate?.toFixed(1) || 0}%\n\n`;
    
    if (data.trends && data.trends.length > 0) {
      content += `TREND VERİLERİ\n`;
      content += `${'-'.repeat(30)}\n`;
      data.trends.forEach((trend: any) => {
        content += `${trend._id}: Sıcaklık: ${trend.avgTemperature?.toFixed(2) || 0}°C, RPM: ${trend.avgRpm?.toFixed(0) || 0}, Güç: ${trend.avgPower?.toFixed(2) || 0}kW\n`;
      });
    }
    
    return content;
  };

  const formatFactoryReportForPDF = (data: any) => {
    let content = `FABRİKA RAPORU\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    content += `GENEL METRİKLER\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `Toplam Makine: ${data.overall?.machineCount || 0}\n`;
    content += `Ortalama Sıcaklık: ${data.overall?.avgTemperature?.toFixed(2) || 0} °C\n`;
    content += `Toplam Üretim: ${data.overall?.totalProduced || 0}\n`;
    content += `Genel Çalışma Oranı: ${data.overall?.overallUptime?.toFixed(1) || 0}%\n`;
    content += `Ortalama OEE: ${data.overall?.avgOee?.toFixed(1) || 0}%\n\n`;
    
    if (data.machinePerformance && data.machinePerformance.length > 0) {
      content += `MAKİNE PERFORMANSI\n`;
      content += `${'-'.repeat(30)}\n`;
      data.machinePerformance.forEach((machine: any) => {
        content += `${machine._id?.machineName || ''} (${machine._id?.machineType || ''})\n`;
        content += `  Üretim: ${machine.totalProduced || 0}, Çalışma Oranı: ${machine.uptimePercentage?.toFixed(1) || 0}%\n`;
      });
    }
    
    return content;
  };

  const formatAnomalyReportForPDF = (data: any) => {
    let content = `ANOMALİ RAPORU\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    if (data.summary && data.summary.length > 0) {
      content += `ANOMALİ ÖZETİ\n`;
      content += `${'-'.repeat(30)}\n`;
      data.summary.forEach((item: any) => {
        content += `${item._id}: ${item.count} adet\n`;
      });
      content += '\n';
    }
    
    if (data.anomalies && data.anomalies.length > 0) {
      content += `MAKİNE BAZLI ANOMALİLER\n`;
      content += `${'-'.repeat(30)}\n`;
      data.anomalies.forEach((anomaly: any) => {
        content += `${anomaly._id?.machineName || ''}: ${anomaly.totalAnomalies || 0} anomali\n`;
        if (anomaly.anomalies) {
          anomaly.anomalies.forEach((a: any) => {
            content += `  - ${a.type}: ${a.count} adet (${a.severity})\n`;
          });
        }
        content += '\n';
      });
    }
    
    return content;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#fadb14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
      case 'Operational': return 'success';
      case 'Idle': return 'warning';
      case 'Maintenance': return 'processing';
      case 'Breakdown': return 'error';
      default: return 'default';
    }
  };

  const anomalyColumns = [
    {
      title: 'Makine',
      dataIndex: ['_id', 'machineName'],
      key: 'machineName',
    },
    {
      title: 'Toplam Anomali',
      dataIndex: 'totalAnomalies',
      key: 'totalAnomalies',
      sorter: (a: any, b: any) => a.totalAnomalies - b.totalAnomalies,
    },
    {
      title: 'Anomali Türleri',
      dataIndex: 'anomalies',
      key: 'anomalies',
      render: (anomalies: any[]) => (
        <div>
          {anomalies.map((anomaly, index) => (
            <Tag
              key={index}
              color={getSeverityColor(anomaly.severity)}
              style={{ marginBottom: 4 }}
            >
              {anomaly.type}: {anomaly.count}
            </Tag>
          ))}
        </div>
      ),
    }
  ];

  const machinePerformanceColumns = [
    {
      title: 'Makine',
      dataIndex: ['_id', 'machineName'],
      key: 'machineName',
    },
    {
      title: 'Tür',
      dataIndex: ['_id', 'machineType'],
      key: 'machineType',
    },
    {
      title: 'Çalışma Oranı',
      dataIndex: 'uptimePercentage',
      key: 'uptimePercentage',
      render: (value: number) => (
        <Progress 
          percent={Math.round(value)} 
          status={value > 80 ? 'success' : value > 60 ? 'normal' : 'exception'}
          size="small"
        />
      ),
    },
    {
      title: 'OEE',
      dataIndex: 'avgOee',
      key: 'avgOee',
      render: (value: number) => `${(value || 0).toFixed(1)}%`,
    },
    {
      title: 'Üretim',
      dataIndex: 'totalProduced',
      key: 'totalProduced',
    },
    {
      title: 'Red Oranı',
      dataIndex: 'rejectionRate',
      key: 'rejectionRate',
      render: (value: number) => (
        <Text type={value > 15 ? 'danger' : value > 5 ? 'warning' : 'success'}>
          %{(value || 0).toFixed(1)}
        </Text>
      ),
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const tabItems = [
    {
      key: 'machine',
      label: 'Makine Raporu',
      children: loading ? (
        <LoadingSpinner loading={loading} />
      ) : machineReport ? (
        <div>
          {/* Machine Overview */}
          <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]} style={{ marginBottom: screens.xs ? 16 : 24 }}>
            <Col xs={12} sm={12} md={6}>
              <Card 
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Ortalama Sıcaklık</span>}
                  value={machineReport.performance.avgTemperature?.toFixed(1) || 0}
                  suffix="°C"
                  valueStyle={{ 
                    color: (machineReport.performance.avgTemperature || 0) > 80 ? '#cf1322' : '#3f8600',
                    fontSize: screens.xs ? '18px' : '24px'
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Çalışma Oranı</span>}
                  value={machineReport.performance.uptimePercentage?.toFixed(1) || 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ fontSize: screens.xs ? '18px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Toplam Üretim</span>}
                  value={machineReport.performance.totalProduced || 0}
                  prefix={<DashboardOutlined />}
                  valueStyle={{ fontSize: screens.xs ? '18px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Red Oranı</span>}
                  value={machineReport.performance.rejectionRate?.toFixed(1) || 0}
                  suffix="%"
                  valueStyle={{ 
                    color: (machineReport.performance.rejectionRate || 0) > 10 ? '#cf1322' : '#3f8600',
                    fontSize: screens.xs ? '18px' : '24px'
                  }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Temperature Trend */}
          <Card 
            title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Sıcaklık Trendi</span>}
            style={{ 
              marginBottom: screens.xs ? 12 : 16,
              borderRadius: screens.xs ? '6px' : '8px'
            }}
            bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
          >
            <ResponsiveContainer width="100%" height={screens.xs ? 200 : 300}>
              <LineChart data={machineReport.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  fontSize={screens.xs ? 10 : 12}
                  angle={screens.xs ? -45 : 0}
                  textAnchor={screens.xs ? 'end' : 'middle'}
                  height={screens.xs ? 60 : 30}
                />
                <YAxis fontSize={screens.xs ? 10 : 12} />
                <Tooltip 
                  contentStyle={{ fontSize: screens.xs ? '12px' : '14px' }}
                />
                <Legend wrapperStyle={{ fontSize: screens.xs ? '12px' : '14px' }} />
                <Line 
                  type="monotone" 
                  dataKey="avgTemperature" 
                  stroke="#8884d8" 
                  name="Ortalama Sıcaklık (°C)"
                  strokeWidth={screens.xs ? 2 : 3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Power and RPM Trends */}
          <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
            <Col xs={24} sm={24} md={12}>
              <Card 
                title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Güç Tüketimi</span>}
                style={{ 
                  marginBottom: screens.xs ? 12 : 0,
                  borderRadius: screens.xs ? '6px' : '8px'
                }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <ResponsiveContainer width="100%" height={screens.xs ? 180 : 250}>
                  <AreaChart data={machineReport.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      fontSize={screens.xs ? 10 : 12}
                      angle={screens.xs ? -45 : 0}
                      textAnchor={screens.xs ? 'end' : 'middle'}
                      height={screens.xs ? 60 : 30}
                    />
                    <YAxis fontSize={screens.xs ? 10 : 12} />
                    <Tooltip 
                      contentStyle={{ fontSize: screens.xs ? '12px' : '14px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgPower" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Ortalama Güç (kW)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Card 
                title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>RPM Trendi</span>}
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <ResponsiveContainer width="100%" height={screens.xs ? 180 : 250}>
                  <LineChart data={machineReport.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      fontSize={screens.xs ? 10 : 12}
                      angle={screens.xs ? -45 : 0}
                      textAnchor={screens.xs ? 'end' : 'middle'}
                      height={screens.xs ? 60 : 30}
                    />
                    <YAxis fontSize={screens.xs ? 10 : 12} />
                    <Tooltip 
                      contentStyle={{ fontSize: screens.xs ? '12px' : '14px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgRpm" 
                      stroke="#ffc658" 
                      name="Ortalama RPM"
                      strokeWidth={screens.xs ? 2 : 3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <Alert
          message="Rapor Bekleniyor"
          description="Makine seçin ve rapor oluştur butonuna tıklayın"
          type="info"
          showIcon
        />
      )
    },
    {
      key: 'factory',
      label: 'Fabrika Raporu',
      children: loading ? (
        <LoadingSpinner loading={loading} />
      ) : factoryReport ? (
        <div>
          {/* Factory Overview */}
          <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]} style={{ marginBottom: screens.xs ? 16 : 24 }}>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Toplam Makine</span>}
                  value={factoryReport.overall.machineCount || 0}
                  prefix={<DashboardOutlined />}
                  valueStyle={{ fontSize: screens.xs ? '18px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Genel Çalışma Oranı</span>}
                  value={factoryReport.overall.overallUptime?.toFixed(1) || 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ fontSize: screens.xs ? '18px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Toplam Üretim</span>}
                  value={factoryReport.overall.totalProduced || 0}
                  valueStyle={{ fontSize: screens.xs ? '18px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: screens.xs ? '12px' : '14px' }}>Ortalama OEE</span>}
                  value={factoryReport.overall.avgOee?.toFixed(1) || 0}
                  suffix="%"
                  valueStyle={{ fontSize: screens.xs ? '18px' : '24px' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Machine Performance Table */}
          <Card 
            title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Makine Performansı</span>}
            style={{ 
              marginBottom: screens.xs ? 12 : 16,
              borderRadius: screens.xs ? '6px' : '8px'
            }}
            bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table
                dataSource={factoryReport.machinePerformance}
                columns={machinePerformanceColumns}
                rowKey={(record) => record._id.machineId}
                pagination={{ 
                  pageSize: screens.xs ? 5 : 10,
                  size: screens.xs ? 'small' : 'default',
                  showSizeChanger: !screens.xs
                }}
                size={screens.xs ? 'small' : 'middle'}
                scroll={{ x: screens.xs ? 800 : undefined }}
              />
            </div>
          </Card>

          {/* Shift Performance */}
          <Card 
            title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Vardiya Performansı</span>}
            style={{ borderRadius: screens.xs ? '6px' : '8px' }}
            bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
          >
            <ResponsiveContainer width="100%" height={screens.xs ? 200 : 300}>
              <BarChart data={factoryReport.shiftPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  fontSize={screens.xs ? 10 : 12}
                  angle={screens.xs ? -45 : 0}
                  textAnchor={screens.xs ? 'end' : 'middle'}
                  height={screens.xs ? 60 : 30}
                />
                <YAxis fontSize={screens.xs ? 10 : 12} />
                <Tooltip 
                  contentStyle={{ fontSize: screens.xs ? '12px' : '14px' }}
                />
                <Legend wrapperStyle={{ fontSize: screens.xs ? '12px' : '14px' }} />
                <Bar dataKey="totalProduced" fill="#8884d8" name="Toplam Üretim" />
                <Bar dataKey="avgOee" fill="#82ca9d" name="Ortalama OEE (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Alert
          message="Rapor Bekleniyor"
          description="Rapor oluştur butonuna tıklayın"
          type="info"
          showIcon
        />
      )
    },
    {
      key: 'anomalies',
      label: 'Anomali Raporu',
      children: loading ? (
        <LoadingSpinner loading={loading} />
      ) : anomalyReport ? (
        <div>
          {/* Anomaly Summary */}
          {anomalyReport.summary && anomalyReport.summary.length > 0 ? (
            <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]} style={{ marginBottom: screens.xs ? 16 : 24 }}>
              {anomalyReport.summary.map((item: any, index: number) => (
                <Col xs={12} sm={12} md={6} key={item._id}>
                  <Card
                    style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                    bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
                  >
                    <Statistic
                      title={
                        <span style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                          {`${item._id.charAt(0).toUpperCase() + item._id.slice(1)} Anomali`}
                        </span>
                      }
                      value={item.count}
                      valueStyle={{ 
                        color: getSeverityColor(item._id),
                        fontSize: screens.xs ? '18px' : '24px'
                      }}
                      prefix={<WarningOutlined />}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert
              message="🎉 Harika Haber!"
              description="Seçili tarih aralığında herhangi bir anomali tespit edilmedi. Tüm makineler normal parametreler içinde çalışıyor."
              type="success"
              showIcon
              style={{ 
                marginBottom: screens.xs ? 16 : 24,
                fontSize: screens.xs ? '14px' : '16px',
                borderRadius: screens.xs ? '6px' : '8px'
              }}
            />
          )}

          {/* Anomaly Distribution Chart */}
          {anomalyReport.summary && anomalyReport.summary.length > 0 && (
            <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
              <Col xs={24} sm={24} md={12}>
                <Card 
                  title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Anomali Dağılımı</span>}
                  style={{ 
                    marginBottom: screens.xs ? 12 : 0,
                    borderRadius: screens.xs ? '6px' : '8px'
                  }}
                  bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
                >
                  <ResponsiveContainer width="100%" height={screens.xs ? 250 : 300}>
                    <PieChart>
                      <Pie
                        data={anomalyReport.summary}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => 
                          screens.xs ? 
                            `${(percent * 100).toFixed(0)}%` : 
                            `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={screens.xs ? 60 : 80}
                        fill="#8884d8"
                        dataKey="count"
                        fontSize={screens.xs ? 10 : 12}
                      >
                        {anomalyReport.summary.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ fontSize: screens.xs ? '12px' : '14px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Card 
                  title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Makine Bazlı Anomaliler</span>}
                  style={{ borderRadius: screens.xs ? '6px' : '8px' }}
                  bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      dataSource={anomalyReport.anomalies}
                      columns={anomalyColumns}
                      rowKey={(record: any, index) => record._id?.machineId || `anomaly-${index}`}
                      pagination={{ 
                        pageSize: screens.xs ? 3 : 5,
                        size: screens.xs ? 'small' : 'default'
                      }}
                      size="small"
                      scroll={{ x: screens.xs ? 400 : undefined }}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Anomaly Information */}
          <Card 
            title={<span style={{ fontSize: screens.xs ? '14px' : '16px' }}>Anomali Tespiti Hakkında</span>}
            style={{ 
              marginTop: anomalyReport.summary && anomalyReport.summary.length > 0 ? (screens.xs ? 12 : 16) : 0,
              borderRadius: screens.xs ? '6px' : '8px'
            }}
            bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
          >
            <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
              <Col xs={24} sm={12} md={8}>
                <Alert
                  message="Sıcaklık Anomalileri"
                  description="10°C altı veya 85°C üstü değerler"
                  type="info"
                  style={{ 
                    fontSize: screens.xs ? '12px' : '14px',
                    borderRadius: screens.xs ? '4px' : '6px'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Alert
                  message="RPM Anomalileri"
                  description="100 RPM altı veya 2800 RPM üstü değerler"
                  type="info"
                  style={{ 
                    fontSize: screens.xs ? '12px' : '14px',
                    borderRadius: screens.xs ? '4px' : '6px'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Alert
                  message="Güç Anomalileri"
                  description="0.5kW altı veya 9.5kW üstü değerler"
                  type="info"
                  style={{ 
                    fontSize: screens.xs ? '12px' : '14px',
                    borderRadius: screens.xs ? '4px' : '6px'
                  }}
                />
              </Col>
            </Row>
            <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]} style={{ marginTop: screens.xs ? 8 : 16 }}>
              <Col xs={24} sm={12} md={8}>
                <Alert
                  message="Döngü Süresi"
                  description="120 saniye üstü değerler"
                  type="info"
                  style={{ 
                    fontSize: screens.xs ? '12px' : '14px',
                    borderRadius: screens.xs ? '4px' : '6px'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Alert
                  message="Red Oranı"
                  description="%15 üstü red oranları"
                  type="info"
                  style={{ 
                    fontSize: screens.xs ? '12px' : '14px',
                    borderRadius: screens.xs ? '4px' : '6px'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Alert
                  message="Makine Alarmları"
                  description="Aktif alarm durumları"
                  type="info"
                  style={{ 
                    fontSize: screens.xs ? '12px' : '14px',
                    borderRadius: screens.xs ? '4px' : '6px'
                  }}
                />
              </Col>
            </Row>
          </Card>
        </div>
      ) : (
        <Alert
          message="Rapor Bekleniyor"
          description="Rapor oluştur butonuna tıklayın"
          type="info"
          showIcon
        />
      )
    }
  ];

  return (
    <div style={{ padding: screens.xs ? '12px' : '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: screens.xs ? 'center' : 'space-between', 
        alignItems: 'center', 
        marginBottom: screens.xs ? 16 : 24,
        textAlign: screens.xs ? 'center' : 'left'
      }}>
        <Title 
          level={screens.xs ? 3 : 2}
          style={{ 
            margin: 0,
            fontSize: screens.xs ? '20px' : '30px'
          }}
        >
          <DashboardOutlined /> Makine Raporları
        </Title>
      </div>

      <Card 
        style={{ 
          marginBottom: screens.xs ? 16 : 24,
          borderRadius: screens.xs ? '8px' : '12px'
        }}
        bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
      >
        <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && dates[0] && dates[1] && setDateRange([dates[0], dates[1]])}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              size={screens.xs ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Makine Seçin"
              value={selectedMachine}
              onChange={setSelectedMachine}
              style={{ width: '100%' }}
              showSearch
              size={screens.xs ? 'large' : 'middle'}
              filterOption={(input, option) => {
                const children = option?.children?.toString().toLowerCase();
                return children ? children.includes(input.toLowerCase()) : false;
              }}
            >
              {machines.map(machine => (
                <Option key={machine._id} value={machine._id}>
                  {machine.name} ({machine.code})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={() => {
                if (activeTab === 'machine' && selectedMachine) {
                  generateMachineReport();
                } else if (activeTab === 'factory') {
                  generateFactoryReport();
                } else if (activeTab === 'anomalies') {
                  generateAnomalyReport();
                }
              }}
              loading={loading}
              title="Raporları yenile"
              size={screens.xs ? 'large' : 'middle'}
              style={{ 
                width: '100%',
                fontSize: screens.xs ? '14px' : '14px'
              }}
            >
              {screens.xs ? 'Yenile' : 'Yenile'}
            </Button>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'csv',
                    label: 'CSV Dosyası',
                    onClick: () => downloadReport('csv'),
                  },
                  {
                    key: 'excel',
                    label: 'Excel/JSON',
                    onClick: () => downloadReport('excel'),
                  },
                  {
                    key: 'pdf',
                    label: 'Metin Dosyası',
                    onClick: () => downloadReport('pdf'),
                  },
                ],
              }}
            >
              <Button 
                icon={<DownloadOutlined />}
                size={screens.xs ? 'large' : 'middle'}
                style={{ 
                  width: '100%',
                  fontSize: screens.xs ? '14px' : '14px'
                }}
              >
                İndir
              </Button>
            </Dropdown>
          </Col>
        </Row>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange} 
        items={tabItems} 
        size={screens.xs ? 'small' : 'large'}
        style={{
          fontSize: screens.xs ? '14px' : '16px'
        }}
        tabBarStyle={{
          padding: screens.xs ? '0 8px' : '0 16px'
        }}
      />

      {/* Collection Status Modal */}
      <Modal
        title={<Text strong>📊 Veri Toplama Durumu</Text>}
        open={showStatusModal}
        onCancel={() => setShowStatusModal(false)}
        footer={[
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setShowStatusModal(false)}
          >
            Kapat
          </Button>
        ]}
      >
        {/* Collection status content */}
      </Modal>
    </div>
  );
};

export default Reports;
