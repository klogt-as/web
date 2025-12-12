import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
} from "react";
import * as THREE from "three";

export interface BlobState {
  id: string;
  position: THREE.Vector3;
  radius: number;
  color: string;
  sectionIndex: number;
  isBeingMerged: boolean;
  meshRef?: React.RefObject<THREE.Mesh>;
}

interface MergeRequest {
  blobId1: string;
  blobId2: string;
}

interface BlobMergeContextValue {
  blobs: Map<string, BlobState>;
  registerBlob: (id: string, state: BlobState) => void;
  unregisterBlob: (id: string) => void;
  updateBlobPosition: (id: string, position: THREE.Vector3) => void;
  requestMerge: (id1: string, id2: string) => void;
  markBlobAsMerging: (id: string, isMerging: boolean) => void;
  getBlobsInSection: (sectionIndex: number) => BlobState[];
  getBlob: (id: string) => BlobState | undefined;
}

const BlobMergeContext = createContext<BlobMergeContextValue | null>(null);

export const useBlobMerge = () => {
  const context = useContext(BlobMergeContext);
  if (!context) {
    throw new Error("useBlobMerge must be used within BlobMergeProvider");
  }
  return context;
};

interface BlobMergeProviderProps {
  children: React.ReactNode;
  onSectionComplete?: (sectionIndex: number, finalBlob: BlobState) => void;
}

export const BlobMergeProvider: React.FC<BlobMergeProviderProps> = ({
  children,
  onSectionComplete,
}) => {
  const blobsRef = useRef<Map<string, BlobState>>(new Map());
  const mergeQueueRef = useRef<MergeRequest[]>([]);
  const processingMergeRef = useRef(false);

  // Force re-render when needed (for callback triggers)
  const [, forceUpdate] = useState({});

  const registerBlob = useCallback((id: string, state: BlobState) => {
    blobsRef.current.set(id, state);
  }, []);

  const unregisterBlob = useCallback((id: string) => {
    blobsRef.current.delete(id);
  }, []);

  const updateBlobPosition = useCallback(
    (id: string, position: THREE.Vector3) => {
      const blob = blobsRef.current.get(id);
      if (blob) {
        blob.position.copy(position);
      }
    },
    []
  );

  const markBlobAsMerging = useCallback((id: string, isMerging: boolean) => {
    const blob = blobsRef.current.get(id);
    if (blob) {
      blob.isBeingMerged = isMerging;
    }
  }, []);

  const getBlobsInSection = useCallback((sectionIndex: number) => {
    return Array.from(blobsRef.current.values()).filter(
      (blob) => blob.sectionIndex === sectionIndex && !blob.isBeingMerged
    );
  }, []);

  const getBlob = useCallback((id: string) => {
    return blobsRef.current.get(id);
  }, []);

  const requestMerge = useCallback(
    (id1: string, id2: string) => {
      const blob1 = blobsRef.current.get(id1);
      const blob2 = blobsRef.current.get(id2);

      if (!blob1 || !blob2) return;
      if (blob1.isBeingMerged || blob2.isBeingMerged) return;
      if (blob1.sectionIndex !== blob2.sectionIndex) return;

      // Add to merge queue
      mergeQueueRef.current.push({ blobId1: id1, blobId2: id2 });

      // Process merge queue
      if (!processingMergeRef.current) {
        processMergeQueue();
      }
    },
    [onSectionComplete]
  );

  const processMergeQueue = useCallback(() => {
    if (mergeQueueRef.current.length === 0) {
      processingMergeRef.current = false;
      return;
    }

    processingMergeRef.current = true;
    const mergeRequest = mergeQueueRef.current.shift();

    if (!mergeRequest) {
      processingMergeRef.current = false;
      return;
    }

    const blob1 = blobsRef.current.get(mergeRequest.blobId1);
    const blob2 = blobsRef.current.get(mergeRequest.blobId2);

    if (!blob1 || !blob2) {
      processMergeQueue();
      return;
    }

    // Mark both as merging
    blob1.isBeingMerged = true;
    blob2.isBeingMerged = true;

    // Check after merge completes if section is done
    const sectionIndex = blob1.sectionIndex;

    // Delay to allow animation to play
    setTimeout(() => {
      const remainingBlobs = getBlobsInSection(sectionIndex);
      if (remainingBlobs.length === 1 && onSectionComplete) {
        onSectionComplete(sectionIndex, remainingBlobs[0]);
      }

      // Continue processing queue
      processMergeQueue();
    }, 1500); // Match merge animation duration
  }, [onSectionComplete, getBlobsInSection]);

  const value: BlobMergeContextValue = {
    blobs: blobsRef.current,
    registerBlob,
    unregisterBlob,
    updateBlobPosition,
    requestMerge,
    markBlobAsMerging,
    getBlobsInSection,
    getBlob,
  };

  return (
    <BlobMergeContext.Provider value={value}>
      {children}
    </BlobMergeContext.Provider>
  );
};
