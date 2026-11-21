import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudents, fetchStudentById, createStudent } from "../api/studentApi";
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