import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchChapterMaterials,
    uploadChapterMaterial,
    deleteMaterial,
} from "../api/materialsApi";

export function useChapterMaterials(chapterId) {
    return useQuery({
        queryKey: ["materials", chapterId],
        queryFn: () => fetchChapterMaterials(chapterId),
        enabled: !!chapterId,
        refetchInterval: (query) => {
            const list = query.state.data || [];
            const hasPending = list.some(
                (m) => m.processing_status === "PROCESSING" || m.processing_status === "PENDING"
            );
            return hasPending ? 3000 : false;
        },
    });
}

export function useUploadMaterial(chapterId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, title }) =>
            uploadChapterMaterial({ chapterId, file, title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["materials", chapterId] });
        },
    });
}

export function useDeleteMaterial(chapterId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteMaterial,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["materials", chapterId] });
        },
    });
}