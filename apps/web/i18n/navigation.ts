import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Use these instead of next/link and next/navigation so locale prefixing stays consistent with ADR 0011.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
