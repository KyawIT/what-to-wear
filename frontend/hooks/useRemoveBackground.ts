import { useCallback, useEffect, useRef, useState } from "react";
import {resolveUploadUri, blobToBase64} from "@/lib/image/image.utils"
import { removeBackground } from "@/api/rembg/image.api"; // recommended: move to /lib/api/rembg/image.api

type Args = {
    id?: string;
    uri?: string;
};

type State = {
    loading: boolean;
    cutoutUri: string | null; // data:image/png;base64,...
    error: string | null;
};

export function useRemoveBackground({ id, uri }: Args) {
    const [state, setState] = useState<State>({
        loading: false,
        cutoutUri: null,
        error: null,
    });

    const runId = useRef(0);

    const run = useCallback(async () => {
        const myRun = ++runId.current;

        if (!id && !uri) {
            setState({ loading: false, cutoutUri: null, error: "No image selected." });
            return;
        }

        setState({ loading: true, cutoutUri: null, error: null });

        try {
            const uploadUri = await resolveUploadUri({ id, uri });

            const blob = await removeBackground(uploadUri);
            const base64 = await blobToBase64(blob);

            if (myRun !== runId.current) return; // ignore stale runs
            setState({ loading: false, cutoutUri: `data:image/png;base64,${base64}`, error: null });
        } catch (e: any) {
            if (myRun !== runId.current) return;

            const msg = normalizeError(e);
            setState({ loading: false, cutoutUri: null, error: msg });
        }
    }, [id, uri]);

    useEffect(() => {
        run();
    }, [run]);

    const retry = useCallback(() => {
        run();
    }, [run]);

    return {
        loading: state.loading,
        cutoutUri: state.cutoutUri,
        error: state.error,
        retry,
    };
}

function normalizeError(e: any): string {
    const msg = String(e?.message ?? e ?? "Unknown error");

    // Common Expo/RN network errors
    if (msg.includes("Network request failed")) {
        return "Network request failed. Is the rembg service running and reachable?";
    }

    // iOS ph:// issues
    if (msg.toLowerCase().includes("localuri is null")) {
        return "Could not access the local file. Try giving Photos permission or pick a different image.";
    }

    return msg;
}
