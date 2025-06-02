import { ListActions } from "./Common";

export interface Department {
  id: number;
  name: string;
}

export interface DepartmentList extends Department, ListActions {}
