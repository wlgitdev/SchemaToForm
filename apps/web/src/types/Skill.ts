import { ListActions } from "./Common";

export interface Skill {
  id: number;
  name: string;
}

export interface SkillList extends Skill, ListActions {}
