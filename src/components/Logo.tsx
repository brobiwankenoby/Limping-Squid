import Image from "next/image";

export function SquidMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/limpingsquid-logo.png"
      alt="Limping Squid"
      width={256}
      height={256}
      className={`object-contain ${className}`}
      priority
      unoptimized
    />
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <SquidMark className="h-9 w-9" />
      <span
        className={`font-display text-xl font-extrabold tracking-tight ${
          light ? "text-white" : "text-ink"
        }`}
      >
        Limping<span className="text-brand">Squid</span>
      </span>
    </div>
  );
}
