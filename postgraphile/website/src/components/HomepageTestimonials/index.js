import clsx from "clsx";
import React from "react";

import styles from "./styles.module.css";

const TestimonialList = [
  {
    author: "Chad F.",
    title: "senior technical lead",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    quote: (
      <>
        Thanks for making GraphQL something I can use on my project in a robust
        way with minimal effort. 500-1500 requests per second on a single server
        is pretty awesome.
      </>
    ),
  },
  {
    author: "Sam L.",
    title: "full stack developer",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    quote: (
      <>
        This project, Benjie&apos;s handling of it, the docs, support, and
        community is awesome all around. PostGraphile is a powerful, idomatic,
        and elegant tool.
      </>
    ),
  },
  {
    author: "Max D.",
    title: "software consultant",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    quote: (
      <>
        Recently I launched a few mobile and web apps using GraphQL, Great
        stuff, not least thanks to wonderful PostGraphile and Apollo. At this
        point, it&apos;s quite hard for me to come back and enjoy working with
        REST.
      </>
    ),
  },
];

function Testimonial({ Svg, author, quote, title }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.testimonialSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{author}</h3>
        <p>{quote}</p>
      </div>
    </div>
  );
}

export default function HomepageTestimonials() {
  return (
    <section className={styles.testimonials}>
      <div className="container">
        <div className="row">
          {TestimonialList.map((props, idx) => (
            <Testimonial key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
