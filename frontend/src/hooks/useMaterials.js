import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
    fetchChapterMaterials,
    uploadChapterMaterial,
    deleteMaterial,
} from "../api/materialsApi";

export function useChapterMaterials(chapterId) {
    const queryClient = useQueryClient();
    const wasIndexingRef = useRef(false);

    const query = useQuery({
        queryKey: ["materials", chapterId],
        queryFn: () => fetchChapterMaterials(chapterId),
        enabled: !!chapterId,
        refetchInterval: (q) => {
            const list = q.state.data || [];
            const hasPending = list.some(
                (m) => m.processing_status === "PROCESSING" || m.processing_status === "PENDING"
            );
            return hasPending ? 3000 : false;
        },
    });

    useEffect(() => {
        const list = query.data || [];
        const hasPending = list.some(
            (m) => m.processing_status === "PROCESSING" || m.processing_status === "PENDING"
        );

        // Trigger invalidation once when indexing completes
        if (wasIndexingRef.current && !hasPending) {
            queryClient.invalidateQueries({ queryKey: ["allReadyMaterials"] });
        }
        wasIndexingRef.current = hasPending;
    }, [query.data, queryClient]);

    return query;
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
            queryClient.invalidateQueries({ queryKey: ["allReadyMaterials"] });
        },
    });
}