export function SectionEyebrow({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-primary font-semibold">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-[13px] text-muted-foreground max-w-2xl">{description}</p>
      )}
    </div>
  );
}
