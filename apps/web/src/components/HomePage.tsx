import { useState } from "react";
import { DynamicList, DynamicForm, FormData } from "@schematoform/schema-to-ui";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { userSchema, userFormSchema } from "../schemas";
import { User, UserList } from "@/types/User";
import { DepartmentsApi, UsersApi, SkillsApi } from "../api";
import { customTheme } from "./customTheme";
import { Modal } from "./Modal";

const usersApi = new UsersApi();
const departmentsApi = new DepartmentsApi();
const skillsApi = new SkillsApi();
const queryClient = new QueryClient();

const fetchUsers = async (): Promise<User[]> => {
  return usersApi.getAll();
};

const fetchDepartments = async () => departmentsApi.getAll();
const fetchSkills = async () => skillsApi.getAll();

const HomepageContent = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClientInstance = useQueryClient();

  // Pre-load reference data
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

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      if (!selectedUser) throw new Error("No user selected");
      console.log("Updating user:", selectedUser.name, "with data:", userData);
      // Simulate API call
      return userData;
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["users"] });
      setIsFormOpen(false);
      setSelectedUser(null);
    },
  });

  const fetchUsersList = async (): Promise<UserList[]> => {
    const users = await fetchUsers();
    return users.map((user: User) => ({
      ...user,
      actions: [
        {
          label: "Edit",
          variant: "primary" as const,
          onClick: () => {
            setSelectedUser(user);
            setIsFormOpen(true);
          },
        },
        {
          label: "Delete",
          variant: "secondary" as const,
          onClick: () => console.log(`Delete clicked for ${user.name}`),
        },
      ],
    }));
  };

  // Enhanced schema with row actions
  const enhancedUserSchema: typeof userSchema = {
    ...userSchema,
    options: {
      ...userSchema.options,
      selection: {
        enabled: true,
        type: "multi",
      },
      rowActions: {
        onClick: (row: User) => {
          setSelectedUser(row);
          setIsFormOpen(true);
        },
        onDoubleClick: (row: User) => {
          setSelectedUser(row);
          setIsFormOpen(true);
        },
      },
    },
  };

  const handleFormSubmit = async (data: FormData) => {
    await updateUserMutation.mutateAsync(data);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  // Convert User to FormData
  const userToFormData = (user: User): FormData => ({
    name: user.name,
    age: user.age,
    isActive: user.isActive,
    department: user.department,
    skills: user.skills,
    tags: user.tags,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <DynamicList<User>
          schema={enhancedUserSchema}
          queryKey={["users"]}
          queryFn={fetchUsersList}
          queryClient={queryClientInstance}
          className="w-full"
        />
      </div>

      {/* Edit Form Modal */}
      <Modal
        open={isFormOpen && selectedUser !== null}
        onClose={handleFormClose}
        title={`Edit User: ${selectedUser?.name || ""}`}
      >
        {selectedUser && (
          <DynamicForm
            schema={userFormSchema}
            initialValues={userToFormData(selectedUser)}
            onSubmit={handleFormSubmit}
            submitLabel={
              updateUserMutation.isPending ? "Updating..." : "Update User"
            }
            loading={updateUserMutation.isPending}
            theme={customTheme}
            queryClient={queryClientInstance}
          />
        )}
      </Modal>
    </div>
  );
};

export const Homepage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HomepageContent />
    </QueryClientProvider>
  );
};
