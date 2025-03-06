import { useState, useCallback } from "react";
import { FormData } from "@schematoform/schema-to-ui";
import { Modal } from "./Modal";
import TestForm from "./TestForm";

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const handleSubmit = useCallback(async (values: FormData) => {
    setFormData(values);
    setIsModalOpen(false);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Form Schema Test</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Form
        </button>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dynamic Form"
      >
        <div className="p-4">
          <TestForm
            onSubmit={handleSubmit}
            initialValues={formData || undefined}
          />
        </div>
      </Modal>

      <div className="mt-8">
        {formData ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Submitted Data
              </h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
            <p className="text-gray-500">No form data submitted yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
