# Coolkid Hub

O **Coolkid Hub** é uma biblioteca comunitária para descobrir, organizar e compartilhar mods, addons, mapas, aplicativos e ferramentas digitais. A versão atual transforma a lista simples de links em uma experiência de catálogo responsiva, com busca, filtros, favoritos locais, compartilhamento por URL e painel administrativo conectado ao Supabase.

## O que mudou

A página inicial agora possui uma identidade visual completa, navegação contextual, hero section, métricas da biblioteca, cards informativos, filtro por categoria, ordenação, busca por nome/categoria/domínio, favoritos persistidos no navegador e notificações não intrusivas. O layout foi construído para funcionar em desktop, tablet e celular, com estados de carregamento, vazio, erro e retry.

O painel administrativo foi refeito para corrigir o JavaScript quebrado da versão anterior. Ele agora valida login, restaura sessões do Supabase Auth, publica recursos, edita registros, exclui com confirmação, lista erros de consulta e oferece feedback visual durante cada operação. O formulário aceita `nome`, `link`, `categoria` e `descrição`; os dois últimos campos são opcionais e têm fallback automático quando ainda não existem na tabela.

A página `shared/` foi redesenhada para funcionar como uma landing page de recurso compartilhado. Ela busca o post por `codigo`, valida o destino, sanitiza conteúdo dinâmico, atualiza o título/descrição da página e permite copiar o endereço da descoberta.

## Tecnologias

| Camada | Implementação |
| --- | --- |
| Interface | HTML sem framework, CSS responsivo e JavaScript moderno |
| Dados | Supabase Database via cliente público `anon` |
| Autenticação | Supabase Auth com login por e-mail e senha |
| Publicação | GitHub Pages ou qualquer hospedagem estática |
| Persistência local | `localStorage` para favoritos do visitante |
| Tipografia | Space Grotesk e DM Mono via Google Fonts |

## Estrutura principal

```text
.
├── index.html              # Catálogo público
├── admin/index.html        # Control room do administrador
├── shared/index.html       # Página de recurso compartilhado
├── css/style.css           # Sistema visual e responsividade
├── js/app.js               # Busca, filtros, favoritos e cards públicos
├── js/admin.js             # Auth e CRUD administrativo
├── js/shared.js            # Leitura e compartilhamento de um post
└── js/supabase.js          # Configuração do cliente Supabase
```

## Estrutura esperada no Supabase

A tabela existente deve se chamar `posts` e conter, no mínimo, as colunas abaixo. O campo `codigo` precisa ser único para que os links compartilhados sejam estáveis.

| Coluna | Tipo sugerido | Obrigatória | Uso |
| --- | --- | --- | --- |
| `id` | `uuid` ou `int8` | Sim | Identificador do registro |
| `nome` | `text` | Sim | Nome mostrado nos cards |
| `link` | `text` | Sim | URL externa do recurso |
| `codigo` | `text` | Sim | Código usado em `shared/?post=...` |
| `criado_em` | `timestamptz` | Recomendada | Ordenação e data do card |
| `categoria` | `text` | Opcional | Categoria explícita |
| `descricao` | `text` | Opcional | Resumo do recurso |
| `destaque` | `boolean` | Opcional | Sinaliza um card como destaque |

Se a tabela ainda não possuir os campos opcionais, a aplicação continua funcionando: a categoria é inferida pelo nome/link e a descrição recebe um texto padrão. Para enriquecer os cards, adicione as colunas `categoria`, `descricao` e `destaque` pelo painel SQL do seu projeto Supabase.

## Configuração do cliente

Edite `js/supabase.js` com a URL do projeto e a chave pública `anon` correspondente. A chave `anon` pode aparecer no front-end de uma aplicação estática, mas o banco deve estar protegido por **Row Level Security (RLS)** e políticas específicas. Nunca coloque uma `service_role key` neste repositório.

A situação observada no projeto original é que o host configurado em `js/supabase.js` não respondeu durante o teste local, retornando `Could not resolve host`. Se o endereço do projeto foi removido, renomeado ou está incorreto, substitua `SUPABASE_URL` e `SUPABASE_KEY` por valores de uma instância ativa e publique novamente.

## Políticas mínimas recomendadas

A política pública deve permitir apenas leitura dos posts publicados. Inserção, atualização e exclusão devem exigir um usuário autenticado, idealmente limitado ao administrador do projeto. A regra exata depende do seu modelo de usuários, portanto deve ser aplicada no SQL Editor do Supabase com cuidado.

> O front-end nunca deve ser considerado a camada de segurança. A autorização final precisa ser garantida pelas políticas RLS no banco.

## Testar localmente

Como o projeto é estático, você pode abrir os arquivos em qualquer servidor local. Um exemplo com Python é:

```bash
python3 -m http.server 4173
```

Depois, acesse `http://localhost:4173/`.

Para testar a interface sem depender de uma instância Supabase disponível, use o modo de demonstração explícito:

```text
http://localhost:4173/?demo=1
```

O modo demo usa registros fictícios apenas no navegador; ele não publica nem altera dados reais.

## Publicar no GitHub Pages

A aplicação não precisa de build. Basta fazer commit das alterações na branch publicada pelo repositório e configurar o GitHub Pages para servir a raiz do projeto. Verifique também se os caminhos relativos `admin/`, `shared/`, `css/` e `js/` continuam disponíveis no endereço final.

Antes de publicar, confirme três pontos: a URL do Supabase responde, as políticas RLS permitem leitura pública, e o usuário administrativo consegue autenticar e realizar o CRUD. Caso algum desses pontos falhe, o site ainda mostra estados de erro amigáveis, mas os recursos reais não serão carregados.

## Licença

Este projeto permanece aberto para evolução e adaptação pela comunidade.
