import { Check } from "lucide-react";
import { evaluatePassword } from "~/lib/auth-schemas";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { criteria, score, strengthLabel, colorClass } = evaluatePassword(password);

  return (
    <div className="space-y-3 pt-2 text-xs">
      {/* 4-Segment Strength Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-zinc-400">Password Strength</span>
          <span className={`text-[11px] font-semibold ${
            score === 1 ? "text-rose-400" :
            score === 2 ? "text-amber-400" :
            score === 3 ? "text-blue-400" :
            "text-emerald-400"
          }`}>
            {strengthLabel}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`rounded-full h-full transition-all duration-300 ${
                score >= step ? colorClass : "bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              item.met ? "text-emerald-400 font-medium" : "text-zinc-500"
            }`}
          >
            {item.met ? (
              <Check className="h-3 w-3 shrink-0 text-emerald-400 stroke-[2.5]" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 ml-1 mr-0.5 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
