import { getDefaultTenant } from "@/lib/tenant/config";

export const mockTenant = getDefaultTenant();

export const mockLiveUsers = [
  {
    id: "u1",
    name: "Aarav Shetty",
    email: "aarav@sit.ac.in",
    department: "CSE",
    status: "in",
    entryTime: "09:02",
    exitTime: null,
    latitude: 13.32609,
    longitude: 77.12623,
    online: true
  },
  {
    id: "u2",
    name: "Diya Rao",
    email: "diya@sit.ac.in",
    department: "ECE",
    status: "recent",
    entryTime: "09:06",
    exitTime: "10:12",
    latitude: 13.32645,
    longitude: 77.12668,
    online: true
  },
  {
    id: "u3",
    name: "Kabir Jain",
    email: "kabir@sit.ac.in",
    department: "MECH",
    status: "out",
    entryTime: null,
    exitTime: null,
    latitude: 13.32575,
    longitude: 77.12581,
    online: false
  }
];
