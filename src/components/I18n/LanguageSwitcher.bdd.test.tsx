import "../../test/setup";

import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { I18nProvider, useI18n } from "@/i18n/client";
import { getMessages } from "@/i18n/messages";
import LanguageSwitcher from "@/components/I18n/LanguageSwitcher";
import { given, then, when } from "@/test/bdd";

function SignOutLabel() {
  const { t } = useI18n();
  return <div data-testid="sign-out-label">{t("auth.sign_out")}</div>;
}

describe("LanguageSwitcher (BDD)", () => {
  it("Given zh-CN, When toggled, Then it switches to English instantly and writes cookie", async () => {
    await given("the app is rendered in zh-CN", async () => {
      render(
        <I18nProvider locale="zh-CN" messages={getMessages("zh-CN")}>
          <LanguageSwitcher />
          <SignOutLabel />
        </I18nProvider>,
      );
    });

    await then("it shows zh-CN UI initially", async () => {
      expect(screen.getByText("中")).toBeTruthy();
      expect(screen.getByTestId("sign-out-label").textContent).toContain("退出");
    });

    await when("the user toggles language", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button"));
    });

    await then("it updates UI without a full refresh and persists cookie", async () => {
      expect(screen.getByText("EN")).toBeTruthy();
      expect(screen.getByTestId("sign-out-label").textContent).toContain(
        "Sign out",
      );
      expect(document.cookie).toContain("locale=en");
    });
  });
});
