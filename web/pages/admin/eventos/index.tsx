import { withAdminPage } from "../../../lib/adminPage";
import { redirecionarCadastro } from "../../../lib/admin-redirecionamentos";

// Compatibility entry point. The annual panel owns the only form for this sector.
export default function CadastroLegado() { return null; }

export const getServerSideProps = withAdminPage((context) => redirecionarCadastro(context, "eventos"));
