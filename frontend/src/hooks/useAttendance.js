import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchBatchAttendance,
    markBatchAttendance,
    fetchStudentAttendance,
} from "../api/attendanceApi";

export function useBatchAttendance(batchId, targetDate) {
    return useQuery({
        queryKey: ["attendance", "batch", batchId, targetDate],
        queryFn: () => fetchBatchAttendance(batchId, targetDate),
        enabled: !!batchId && !!targetDate,
    });
}

export function useMarkBatchAttendance(batchId, targetDate) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markBatchAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", "batch", batchId, targetDate],
            });
            // Prefix invalidation refreshes any cached student attendance profiles
            queryClient.invalidateQueries({
                queryKey: ["attendance", "student"],
            });
        },
    });
}

export function useStudentAttendance(studentId) {
    return useQuery({
        queryKey: ["attendance", "student", studentId],
        queryFn: () => fetchStudentAttendance(studentId),
        enabled: !!studentId,
    });
}