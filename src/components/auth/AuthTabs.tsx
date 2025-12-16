import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import type { AuthTabValue } from "./types";

interface AuthTabsProps {
  value: AuthTabValue;
  onValueChange: (value: AuthTabValue) => void;
  loginContent: React.ReactNode;
  registerContent: React.ReactNode;
}

/**
 * Komponent zakładek przełączający między formularzem logowania a rejestracji.
 * Oparty na Shadcn/ui Tabs z pełną obsługą klawiatury.
 */
export function AuthTabs({ value, onValueChange, loginContent, registerContent }: AuthTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) => onValueChange(newValue as AuthTabValue)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Zaloguj się</TabsTrigger>
        <TabsTrigger value="register">Zarejestruj się</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-4">
        {loginContent}
      </TabsContent>

      <TabsContent value="register" className="mt-4">
        {registerContent}
      </TabsContent>
    </Tabs>
  );
}

