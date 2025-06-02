import { Department } from "@/types/Department";

export class DepartmentsApi {
  constructor() {}

  /**
   * getAll
   */
  public getAll(): Department[] {
    return [
      { id: 1, name: "Engineering" },
      { id: 2, name: "Marketing" },
      { id: 3, name: "HR" },
      { id: 4, name: "Finance" },
      { id: 5, name: "Operations" },
    ];
  }
}
