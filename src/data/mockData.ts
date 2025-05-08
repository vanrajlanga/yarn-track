import { Order, User, OrderStatus } from '../types';

// Mock users
export const mockUsers: User[] = [
  { id: 'user1', username: 'johndoe', name: 'John Doe', role: 'sales', department: 'Domestic Sales' },
  { id: 'user2', username: 'janedoe', name: 'Jane Doe', role: 'sales', department: 'Export Sales' },
  { id: 'user3', username: 'operator', name: 'Sam Operator', role: 'operator', department: 'Order Processing' },
  { id: 'user4', username: 'factory', name: 'Mike Factory', role: 'factory', department: 'Production' },
  { id: 'user5', username: 'admin', name: 'Admin User', role: 'admin', department: 'Management' },
];

// Helper to generate a random date in the last 30 days
const getRandomDate = (daysAgo = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
};

// Mock orders
export const mockOrders: Order[] = [
  {
    id: '1',
    sdyNumber: 'SDY-001',
    date: getRandomDate(),
    partyName: 'ABC Textiles',
    deliveryParty: 'ABC Textiles',
    salespersonId: 'user1',
    denier: '150',
    slNumber: 'SL-001',
    currentStatus: 'packed',
    statusHistory: [
      {
        status: 'received',
        timestamp: getRandomDate(),
        updatedBy: 'user1',
      },
      {
        status: 'dyeing',
        timestamp: getRandomDate(),
        updatedBy: 'user3',
      },
      {
        status: 'dyeing_complete',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
      {
        status: 'conning',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
      {
        status: 'conning_complete',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
      {
        status: 'packing',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
      {
        status: 'packed',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
    ],
  },
  {
    id: '2',
    sdyNumber: 'SDY-002',
    date: getRandomDate(),
    partyName: 'XYZ Fabrics',
    deliveryParty: 'XYZ Fabrics',
    salespersonId: 'user2',
    denier: '200',
    slNumber: 'SL-002',
    currentStatus: 'dyeing',
    statusHistory: [
      {
        status: 'received',
        timestamp: getRandomDate(),
        updatedBy: 'user2',
      },
      {
        status: 'dyeing',
        timestamp: getRandomDate(),
        updatedBy: 'user3',
      },
    ],
  },
  {
    id: '3',
    sdyNumber: 'SDY-003',
    date: getRandomDate(),
    partyName: 'PQR Industries',
    deliveryParty: 'PQR Industries',
    salespersonId: 'user1',
    denier: '100',
    slNumber: 'SL-003',
    currentStatus: 'conning',
    statusHistory: [
      {
        status: 'received',
        timestamp: getRandomDate(),
        updatedBy: 'user1',
      },
      {
        status: 'dyeing',
        timestamp: getRandomDate(),
        updatedBy: 'user3',
      },
      {
        status: 'dyeing_complete',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
      {
        status: 'conning',
        timestamp: getRandomDate(),
        updatedBy: 'user4',
      },
    ],
  },
];

// Generate mock data for analytics
export const generateAnalyticsData = () => {
  const ordersByStage = {
    received: mockOrders.filter(o => o.currentStatus === 'received').length,
    dyeing: mockOrders.filter(o => o.currentStatus === 'dyeing').length,
    dyeing_complete: mockOrders.filter(o => o.currentStatus === 'dyeing_complete').length,
    conning: mockOrders.filter(o => o.currentStatus === 'conning').length,
    conning_complete: mockOrders.filter(o => o.currentStatus === 'conning_complete').length,
    packing: mockOrders.filter(o => o.currentStatus === 'packing').length,
    packed: mockOrders.filter(o => o.currentStatus === 'packed').length,
  };

  // Calculate average processing times (random for mock)
  const processingTimes = {
    dyeing: Math.floor(Math.random() * 24) + 12, // hours
    conning: Math.floor(Math.random() * 10) + 8, // hours
    packing: Math.floor(Math.random() * 6) + 4, // hours
  };

  // Generate weekly throughput
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const weeklyThroughput = weeks.map(week => ({
    week,
    count: Math.floor(Math.random() * 15) + 5,
  }));

  return {
    ordersByStage,
    processingTimes,
    weeklyThroughput,
    totalActive: mockOrders.filter(o => o.currentStatus !== 'packed').length,
    totalCompleted: mockOrders.filter(o => o.currentStatus === 'packed').length,
  };
};