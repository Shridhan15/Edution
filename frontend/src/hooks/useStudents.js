import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudents, createStudent } from "../api/studentApi";

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
            // Automatically marks the students cache as stale and refetches it
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });
}