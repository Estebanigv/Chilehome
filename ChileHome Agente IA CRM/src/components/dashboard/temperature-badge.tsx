type Temperature = "hot" | "warm" | "cold";

interface TemperatureBadgeProps {
  temp: Temperature;
}

const config: Record<Temperature, { label: string; classes: string }> = {
  hot: {
    label: "🔥 Caliente",
    classes: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
  warm: {
    label: "🌤 Tibio",
    classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  cold: {
    label: "❄️ Frío",
    classes: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
};

export default function TemperatureBadge({ temp }: TemperatureBadgeProps) {
  const { label, classes } = config[temp];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
