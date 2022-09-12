// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

// TODO: change this to "graphile"?
const organizationName = "benjie";
// TODO: change this to "graphql" or similar?
const projectName = "postgraphile-private";

const editUrl = `https://github.com/${organizationName}/${projectName}/tree/main/website/`;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Graphile GraphQL Suite",
  tagline: "Fast GraphQL APIs... fast!",
  url: "https://graphql.graphile.org",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName, // Usually your GitHub org/user name.
  projectName, // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          id: "default",
          path: "grafast",
          routeBasePath: "grafast",
          sidebarPath: require.resolve("./sidebars.js"),
          // Remove this to remove the "edit this page" links.
          editUrl,
        },
        blog: false /*{
          showReadingTime: true,
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/graphile/graphql/tree/main/website/blog/",
        }*/,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "grafserv",
        path: "grafserv",
        routeBasePath: "grafserv",
        sidebarPath: require.resolve("./sidebars.js"),
        editUrl,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "GraphileQL",
        logo: {
          alt: "Graphile GraphQL Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "index",
            position: "left",
            label: "Grafast",
          },
          {
            type: "doc",
            docId: "index",
            docsPluginId: "grafserv",
            position: "left",
            label: "Grafserv",
          },
          // { to: "/blog", label: "Blog", position: "left" },
          {
            href: `https://github.com/${organizationName}/${projectName}`,
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Grafast",
                to: "/grafast/",
              },
              {
                label: "Grafserv",
                to: "/grafserv/",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/graphile",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/GraphileHQ",
              },
            ],
          },
          {
            title: "More",
            items: [
              /*{
                label: "Blog",
                to: "/blog",
              },*/
              {
                label: "GitHub",
                href: `https://github.com/${organizationName}/${projectName}`,
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Graphile Ltd. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
