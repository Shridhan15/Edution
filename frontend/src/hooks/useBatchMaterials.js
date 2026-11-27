import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchBatchMaterials,
    fetchAllReadyMaterials,
    assignBatchMaterials,
    unassignBatchMaterial,
} from "../api/batchMaterialsApi";

export function useBatchMaterials(batchId) {
    return useQuery({
        queryKey: ["batchMaterials", batchId],
        queryFn: () => fetchBatchMaterials(batchId),
        enabled: !!batchId,
    });
}

export function useAllReadyMaterials(enabled = true) {
    return useQuery({
        queryKey: ["allReadyMaterials"],
        queryFn: fetchAllReadyMaterials,
        enabled,
    });
}

export function useAssignBatchMaterials(batchId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (materialIds) => assignBatchMaterials({ batchId, materialIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["batchMaterials", batchId] });
        },
    });
}

export function useUnassignBatchMaterial(batchId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (materialId) => unassignBatchMaterial({ batchId, materialId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["batchMaterials", batchId] });
        },
    });
}