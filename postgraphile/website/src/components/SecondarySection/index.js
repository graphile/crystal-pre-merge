import clsx from "clsx";
import React from "react";

import styles from "./styles.module.css";

export default function SecondaryContent({ title, tagline, body, Svg }) {
  return (
    <section className={styles.secondarySection}>
      <div className="container">
        <div className={clsx("row", styles.secondaryRow)}>
          <div className="col col--6">
            <Svg className={styles.secondarySvg} role="img" />
          </div>
          <div className="col col--6">
            <div>
              <h2>{title}</h2>
              <h3>{tagline}</h3>
              <p>{body}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
