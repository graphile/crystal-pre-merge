import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import HomepageTestimonials from "@site/src/components/HomepageTestimonials";
import SecondarySection from "@site/src/components/SecondarySection";
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
        <div className={clsx("row", styles.heroRow)}>
          <div className="col col--6">
            <div className={styles.github}>
              <img
                className={styles.githubButton}
                src="https://img.shields.io/github/stars/graphile/postgraphile?label=Star&style=social"
              />
            </div>
            <h1 className={clsx("padding-vert--md", styles.hero)}>
              {siteConfig.tagline}
            </h1>
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
        <HomepageTestimonials />
        <HomepageFeatures />
        <SecondarySection
          title={`Graphile Starter`}
          tagline={`A quick-start project for full-stack application development in React, Node.js, GraphQL and PostgreSQL`}
          body={`Graphile Starter includes the foundations of a modern web application, with a full user registration system, session management, optimised job queue, pre-configured tooling, tests and much more.`}
          Svg={require("@site/static/img/homepage/starter.svg").default}
        />
      </main>
    </Layout>
  );
}
