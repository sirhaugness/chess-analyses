import { BoardImageCropper } from "./BoardImageCropper";

type Props = {
  imageSrc: string;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onBack: () => void;
  onNewImage: () => void;
};

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
