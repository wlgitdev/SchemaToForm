import { ListActions } from "./Common";

export interface User {
  id: number;
  name: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  tags: string[];
  department: number; // department reference
  skills?: number[]; // skills reference
}

export interface UserList extends User, ListActions {}
