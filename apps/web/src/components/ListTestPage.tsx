import { DynamicList } from "@schematoform/schema-to-ui";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { userSchema } from "../schemas/userSchema";
import { User, UserList } from "@/types/User";
import { DepartmentsApi, UsersApi } from "../api";
import { Department } from "@/types/Department";
import { Skill } from "@/types/Skill";
import { SkillsApi } from "@/api/skills";

const usersApi = new UsersApi();
const departmentsApi = new DepartmentsApi();
const skillsApi = new SkillsApi();

const generateActions = (name: string): UserList["actions"] => [
  {
    label: "Edit",
    variant: "primary",
    onClick: () => console.log(`Edit clicked for ${name}`),
  },
  {
    label: "Delete",
    variant: "secondary",
    onClick: () => console.log(`Delete clicked for ${name}`),
  },
];

const queryClient = new QueryClient();

const fetchUsers = async (): Promise<User[]> => {
  return usersApi.getAll();
};

const fetchUsersList = async (): Promise<UserList[]> => {
  const users = await fetchUsers();
  return users.map((user: User) => ({
    ...user,
    actions: generateActions(user.name),
  }));
};

const fetchDepartments = async (): Promise<Department[]> => {
  return departmentsApi.getAll();
};

const fetchSkills = async (): Promise<Skill[]> => {
  return skillsApi.getAll();
};

const ListTestPageContent = () => {
  useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  useQuery({
    queryKey: ["skills"],
    queryFn: fetchSkills,
  });

  useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Dynamic List Test</h1>
      <DynamicList<User>
        schema={userSchema}
        queryKey={["users"]}
        queryFn={fetchUsersList}
        className="w-full"
        queryClient={queryClient}
      />
    </div>
  );
};

export const ListTestPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ListTestPageContent />
    </QueryClientProvider>
  );
};
