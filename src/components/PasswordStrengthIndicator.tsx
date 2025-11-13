import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, text: "", color: "" };

    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/[0-9]/.test(password)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special characters

    // Determine strength level
    if (score <= 2) {
      return { level: 1, text: "Weak", color: "bg-destructive" };
    } else if (score <= 4) {
      return { level: 2, text: "Medium", color: "bg-yellow-500" };
    } else {
      return { level: 3, text: "Strong", color: "bg-green-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength.level ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", {
        "text-destructive": strength.level === 1,
        "text-yellow-600 dark:text-yellow-500": strength.level === 2,
        "text-green-600 dark:text-green-500": strength.level === 3,
      })}>
        Password strength: {strength.text}
      </p>
    </div>
  );
};
