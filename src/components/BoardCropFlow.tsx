import { BoardImageCropper } from "./BoardImageCropper";

type Props = {
  imageSrc: string;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onBack: () => void;
  onNewImage: () => void;
};

/** Manual crop only — OpenCV auto-detection removed to keep mobile UI responsive. */
export function BoardCropFlow({ imageSrc, onConfirm, onBack, onNewImage }: Props) {
  return (
    <BoardImageCropper
      imageSrc={imageSrc}
      onConfirm={onConfirm}
      onBack={onBack}
      onNewImage={onNewImage}
    />
  );
}

export { DETECTION_TIMEOUT_MS } from "../lib/async-utils";
