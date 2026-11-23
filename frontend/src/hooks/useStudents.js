import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudents, fetchStudentById, createStudent, updateStudent, uploadStudentPhoto, deleteStudent } from "../api/studentApi";  
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] }); // Updates enrolled count
    },
  });
}




export function useStudent(studentId) {
  return useQuery({
    queryKey: ["students", studentId],
    queryFn: () => fetchStudentById(studentId),
    enabled: !!studentId,
  });
}


export function useUpdateStudent(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}




export function useUploadStudentPhoto(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => uploadStudentPhoto(studentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: (_, studentId) => {
      queryClient.removeQueries({ queryKey: ["students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}