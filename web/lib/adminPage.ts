import type { GetServerSideProps } from "next";
import { isAdminAuthenticated } from "./adminAuth";

/** Authenticate before loading private props, including Next.js data requests. */
export function withAdminPage<Props extends Record<string, unknown>>(
    loadProps: GetServerSideProps<Props>
): GetServerSideProps<Props> {
    return async (context) => {
        context.res.setHeader("Cache-Control", "private, no-store, max-age=0");

        if (!isAdminAuthenticated(context.req)) {
            return {
                redirect: {
                    destination: "/admin/login",
                    permanent: false,
                },
            };
        }

        return loadProps(context);
    };
}
