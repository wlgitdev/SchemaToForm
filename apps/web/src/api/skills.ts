import { Skill } from "@/types/Skill";

export class SkillsApi {
  constructor() {}

  /**
   * getAll
   */
  public getAll(): Skill[] {
    return [
      { id: 1, name: "Sales" },
      { id: 2, name: "Customer Support" },
      { id: 3, name: "Product Management" },
      { id: 4, name: "Design" },
      { id: 5, name: "Development" },
    ];
  }
}
