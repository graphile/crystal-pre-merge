import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Layout from "@theme/Layout";
import clsx from "clsx";
import React from "react";

import HeroImage from "@site/static/img/homepage/coder.svg";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <div class="row">
          <div class="col col--6">
            <h1 className={styles.hero}>{siteConfig.tagline}</h1>
            <div className={styles.buttons}>
              <Link
                className={clsx(
                  "button button--primary button--lg margin-left--none margin-right--md",
                  styles.buttonHero,
                )}
                to="/postgraphile/next"
              >
                Documentation
              </Link>
              <Link
                className={clsx(
                  "button button--outline button--lg margin-left--none",
                  styles.buttonHero,
                  styles.buttonHeroOutline,
                )}
                to="/postgraphile/next"
              >
                Overview - 5min ⏱
              </Link>
            </div>
          </div>
          <div class="col col--6">
            <HeroImage
              title="Coder sat at monitor"
              className={styles.heroImage}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  //const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`PostGraphile`}
      description="Extensible high-performance automatic GraphQL API for PostgresSQL"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
