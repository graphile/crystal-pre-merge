import clsx from "clsx";
import React from "react";
import Link from "@docusaurus/Link";

import styles from "./styles.module.css";

const ToolList = [
  {
    title: "Graphile Worker",
    tagline: "High performance Node.js/PostgreSQL job queue",
    link: "https://github.com/graphile/worker",
    buttonText: "Documentation",
    description: (
      <>
        Run jobs (e.g. sending emails, generating PDFs, …) "in the background"
        so that your HTTP response code is not held up. Starts jobs almost
        instantly (2ms latency). Used with any PostgreSQL-backed application.
      </>
    ),
  },
  {
    title: "Graphile Migrate",
    tagline:
      "Opinionated SQL-powered productive roll-forward migration tool for PostgreSQL",
    link: "https://github.com/graphile/migrate",
    buttonText: "Documentation",
    description: (
      <>
        Experimental, being developed in the open. Focuses on fast iteration
        speed.
      </>
    ),
  },
];

function Tool({ title, tagline, link, buttonText, description }) {
  return (
    <div className={clsx("col col--4 margin-horiz--md ", styles.tool)}>
      <div className="padding-horiz--md padding--lg">
        <h2>{title}</h2>
        <h3>{tagline}</h3>
        <p>{description}</p>
        <Link
          className={clsx(
            "button button--primary button--lg margin-left--none margin-right--md",
            styles.button,
          )}
          to={link}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}

export default function HomepageTools() {
  return (
    <section className={styles.tools}>
      <div className="container">
        <div className={clsx("row", styles.toolRow)}>
          {ToolList.map((props, idx) => (
            <Tool key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
