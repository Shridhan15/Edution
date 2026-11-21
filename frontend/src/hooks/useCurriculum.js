import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchClasses,
    createClass,
    fetchSubjects,
    createSubject,
    fetchChapters,
    createChapter,
} from "../api/curriculumApi";

export function useClasses() {
    return useQuery({
        queryKey: ["classes"],
        queryFn: fetchClasses,
    });
}

export function useCreateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes"] });
        },
    });
}

export function useSubjects(classId) {
    return useQuery({
        queryKey: ["subjects", classId],
        queryFn: () => fetchSubjects(classId),
        enabled: !!classId, // Only run if classId is present
    });
}

export function useCreateSubject(classId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subjects", classId] });
        },
    });
}

export function useChapters(subjectId) {
    return useQuery({
        queryKey: ["chapters", subjectId],
        queryFn: () => fetchChapters(subjectId),
        enabled: !!subjectId,
    });
}

export function useCreateChapter(subjectId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createChapter,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters", subjectId] });
        },
    });
}