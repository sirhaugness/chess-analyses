type Props = {
  moves: string[];
};

export function MoveHistory({ moves }: Props) {
  if (moves.length === 0) {
    return <p className="text-sm text-stone-500">Ingen trekk ennå.</p>;
  }
  const pairs: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const white = moves[i] ?? "";
    const black = moves[i + 1] ?? "";
    pairs.push(`${num}. ${white}${black ? ` ${black}` : ""}`);
  }
  return (
    <ol className="max-h-32 overflow-y-auto text-sm text-stone-800">
      {pairs.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ol>
  );
}
