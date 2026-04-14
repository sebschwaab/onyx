"use client";

import React, { useContext } from "react";
import { SettingsContext } from "@/providers/SettingsProvider";
import Text from "@/refresh-components/texts/Text";

export default function LoginText() {
  const settings = useContext(SettingsContext);
  return (
    <div className="w-full flex flex-col ">
      <Text as="p" headingH2 text05>
        Bienvenue sur{" "}
        {(settings && settings?.enterpriseSettings?.application_name) || "Onyx"}
      </Text>
      <Text as="p" text03 mainUiMuted>
        Votre plateforme IA open source pour le travail
      </Text>
    </div>
  );
}
