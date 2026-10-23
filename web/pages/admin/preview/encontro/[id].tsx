import { withAdminPage } from "../../../../lib/adminPage";
import { carregarDivulgacaoEncontro } from "../../../../lib/admin-divulgacao";
export { default } from "../../../../components/admin/CartaoEncontro";

export const getServerSideProps = withAdminPage(async (context) => {
    const id = context.params?.id;
    if (typeof id !== "string") return { notFound: true };
    const dados = await carregarDivulgacaoEncontro(id);
    if (!dados) return { notFound: true };
    return { props: dados };
});
