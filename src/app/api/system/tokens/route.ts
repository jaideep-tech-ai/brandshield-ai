import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

/**
 * GET /api/system/tokens
 *
 * Cross-Platform & Flutter Web Design Token Engine:
 * Exports the organization's approved brand visual tokens (colors, typography, logos)
 * along with WCAG 2.1 accessibility thresholds formatted according to the
 * W3C Design Tokens Community Group (DTCG) specification and ready for Flutter / mobile clients.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tokens = await db.visualToken.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "asc" },
    });

    const colors: Record<string, any> = {};
    const typography: Record<string, any> = {};
    const logos: Record<string, any> = {};

    for (const t of tokens) {
      const key = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      if (t.tokenType === "color") {
        const cleanHex = t.value.replace("#", "").toUpperCase();
        colors[key] = {
          $value: t.value,
          $type: "color",
          name: t.name,
          secondary: t.secondary,
          usageNotes: t.usageNotes,
          flutterColorInt: cleanHex.length === 6 ? `0xFF${cleanHex}` : `0x${cleanHex}`,
        };
      } else if (t.tokenType === "typography") {
        typography[key] = {
          $value: t.value,
          $type: "typography",
          name: t.name,
          usageNotes: t.usageNotes,
        };
      } else if (t.tokenType === "logo") {
        logos[key] = {
          $value: t.value,
          $type: "asset",
          name: t.name,
          usageNotes: t.usageNotes,
        };
      }
    }

    return NextResponse.json({
      system: "BrandShield Design Tokens",
      version: "1.1.0",
      organization: {
        id: user.orgId,
        name: user.orgName,
        slug: user.orgSlug,
      },
      wcagThresholds: {
        normalTextAA: 4.5,
        largeTextAA: 3.0,
        normalTextAAA: 7.0,
        largeTextAAA: 4.5,
        complianceStandard: "WCAG 2.1",
      },
      tokens: {
        color: colors,
        typography,
        logo: logos,
      },
      flutterConfig: {
        primaryColorHex: colors.shield_teal?.$value || "#0F766E",
        accentColorHex: colors.aqua_mint?.$value || "#14B8A6",
        fontFamily: "Geist Sans",
        isAccessible: true,
      },
      exportedAt: new Date().toISOString(),
    });
  } catch (e) {
    return jsonError(e);
  }
}
