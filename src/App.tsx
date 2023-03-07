import { useEffect, useMemo, useState, useCallback } from "react";
import { getListOfFaqItems, FaqItem } from "./data";
import { SearchInput } from "./SearchInput";
import "./styles.css";

type BaseParams = Record<string, string | undefined | null>;

function useNavigation<T extends BaseParams>() {
  function getQueryParams(): T {
    if (typeof window === "undefined") {
      return {} as T;
    }

    const url = new URL(window.location.href);

    return Object.fromEntries(url.searchParams.entries()) as T;
  }

  const [queryParams, setQueryParams] = useState<T>(() => getQueryParams());

  useEffect(() => {
    function handleChange() {
      setQueryParams(getQueryParams());
    }

    window.addEventListener("popstate", handleChange);

    return () => {
      window.removeEventListener("popstate", handleChange);
    };
  }, []);

  const getUrl = useCallback(function getUrl(queryParams: T) {
    const currentUrl = new URL(window.location.href);

    const searchParams = new URLSearchParams(
      queryParams as Record<string, string>
    );

    return `${currentUrl.pathname}?${searchParams}`;
  }, []);

  const push = useCallback(
    function push(queryParams: T) {
      window.history.pushState(null, "", getUrl(queryParams));
      setQueryParams(queryParams);
    },
    [getUrl]
  );

  return { queryParams, push, getUrl };
}

type MenuStructure = Record<string, string[] | null>;

type NavigationState = {
  category: string;
  section: string;
  subject: string | undefined | null;
  question: string;
};

export default function App() {
  const [faqItems, setFaqItems] = useState<FaqItem[] | null>(null);

  const navigation = useNavigation<NavigationState>();

  const {
    category: selectedCategory,
    section: selectedSection,
    subject: selectedSubject = null,
    question: selectedQuestion,
  } = navigation.queryParams;

  const getFirstInCategory = (category: string) =>
    faqItems?.find((item) => item.category === category);
  const getFirstInSection = (category: string, section: string) =>
    faqItems?.find(
      (item) => item.category === category && item.section === section
    );
  const getFirstInSubject = (
    category: string,
    section: string,
    subject: string | null
  ) =>
    faqItems?.find(
      (item) =>
        item.category === category &&
        item.section === section &&
        item.subject === subject
    );
  const getQuestion = (
    category: string,
    section: string,
    subject: string | null,
    question: string
  ) =>
    faqItems?.find(
      (item) =>
        item.category === category &&
        item.section === section &&
        item.subject === subject &&
        item.question === question
    );

  function navigateFaqItem(item: FaqItem) {
    const { category, subject, section, question } = item;
    navigation.push({ category, subject, section, question });
  }

  function getUrlFromFaqItem(item: FaqItem) {
    const { category, subject, section, question } = item;
    return navigation.getUrl({ category, subject, section, question });
  }

  // TODO: async navigate (no side effect)
  function validateQueryParams() {
    if (!faqItems) {
      return false;
    }

    if (!faqItems.length) {
      throw new Error("expected at least one faq-item");
    }

    if (selectedQuestion && (!selectedCategory || !selectedSection)) {
      const item = faqItems.find((item) => item.question === selectedQuestion);
      if (item) {
        navigateFaqItem(item);
        return false;
      }
    }

    if (!selectedCategory || !getFirstInCategory(selectedCategory)) {
      navigateFaqItem(faqItems[0]);
      return false;
    }

    if (
      !selectedSection ||
      !getFirstInSection(selectedCategory, selectedSection)
    ) {
      navigateFaqItem(getFirstInCategory(selectedCategory)!);
      return false;
    }

    const selectedItem = selectedSection
      ? faqItems.find((item) => item.question === selectedSection)
      : undefined;

    // question that should have a subject in the url
    if (!selectedSubject && selectedItem && selectedItem.subject !== null) {
      navigateFaqItem(selectedItem);
      return false;
    }

    if (
      selectedSubject &&
      !getFirstInSubject(selectedCategory, selectedSection, selectedSubject)
    ) {
      const { category, subject, section, question } =
        getFirstInSection(selectedCategory, selectedSection) ||
        getFirstInCategory(selectedCategory)!;
      navigation.push({ category, subject, section, question });
      return false;
    }

    if (
      !selectedQuestion ||
      !getQuestion(
        selectedCategory,
        selectedSection,
        selectedSubject,
        selectedQuestion
      )
    ) {
      const { category, subject, section, question } =
        (selectedSubject &&
          getFirstInSubject(
            selectedCategory,
            selectedSection,
            selectedSubject
          )) ||
        getFirstInSection(selectedCategory, selectedSection) ||
        getFirstInCategory(selectedCategory)!;
      navigation.push({ category, subject, section, question });
      return false;
    }

    return true;
  }

  useEffect(() => {
    let isUnmounting = false;

    getListOfFaqItems().then((faqItems) => {
      if (isUnmounting) {
        return;
      }

      setFaqItems(faqItems);
    });

    return () => {
      isUnmounting = true;
    };
  });

  useEffect(() => {
    // TODO: rule = don't animate on page load
    const element = document.querySelector(
      `[data-question="${selectedQuestion}"]`
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedQuestion]);

  const categories = useMemo(
    () => [...(new Set(faqItems?.map((item) => item.category)) ?? [])],
    [faqItems]
  );

  const menuStructure = useMemo<MenuStructure | null>(() => {
    if (!faqItems) {
      return null;
    }

    const structure: MenuStructure = {};

    const categoryItems = faqItems.filter(
      (item) => item.category === selectedCategory
    );

    for (const item of categoryItems) {
      if (item.subject === null) {
        if (Array.isArray(structure[item.section])) {
          console.log(structure[item.section]);
          throw new Error("expected this section not to have subjects");
        }

        structure[item.section] = null;
      } else {
        let currentValue = structure[item.section];
        if (currentValue === null) {
          throw new Error("expected this section to have other subjects");
        }

        if (currentValue === undefined) {
          currentValue = [];
          structure[item.section] = currentValue;
        }

        if (!currentValue.includes(item.subject)) {
          currentValue.push(item.subject);
        }
      }
    }

    return structure;
  }, [faqItems, selectedCategory]);

  const questions = useMemo(
    () =>
      faqItems?.filter(
        (item) =>
          item.category === selectedCategory &&
          item.section === selectedSection &&
          (!selectedSubject
            ? item.subject === null
            : item.subject === selectedSubject)
      ) ?? [],
    [faqItems, selectedCategory, selectedSection, selectedSubject]
  );

  const hasValideQueryParams = validateQueryParams();
  if (!hasValideQueryParams) {
    return null;
  }

  function gotoCategory(category: string) {
    navigateFaqItem(getFirstInCategory(category)!);
  }

  return (
    <div className="App">
      <SearchInput
        faqItems={faqItems!}
        onSubmit={(item) => navigateFaqItem(item)}
        getFaqUrl={getUrlFromFaqItem}
      />

      <hr />
      <section className="faq">
        <div className="categories">
          <ul>
            {categories.map((category) => (
              <li data-active={category === selectedCategory} key={category}>
                <a
                  onClick={(evt) => {
                    evt.preventDefault();
                    gotoCategory(category);
                  }}
                  href={getUrlFromFaqItem(getFirstInCategory(category)!)}
                >
                  {category}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="side">
          <ul>
            {Object.entries(menuStructure || {}).map(([section, subjects]) => {
              return (
                <li data-active={section === selectedSection} key={section}>
                  {subjects ? (
                    section
                  ) : (
                    <a
                      onClick={(evt) => {
                        evt.preventDefault();
                        navigateFaqItem(
                          getFirstInSection(selectedCategory, section)!
                        );
                      }}
                      href={getUrlFromFaqItem(
                        getFirstInSection(selectedCategory, section)!
                      )}
                    >
                      {section}
                    </a>
                  )}

                  {subjects && (
                    <ul className="subjects">
                      {subjects.map((subject) => (
                        <li
                          data-active={
                            section === selectedSection &&
                            subject === selectedSubject
                          }
                          key={subject}
                        >
                          <a
                            onClick={(evt) => {
                              evt.preventDefault();
                              navigateFaqItem(
                                getFirstInSubject(
                                  selectedCategory,
                                  section,
                                  subject
                                )!
                              );
                            }}
                            href={getUrlFromFaqItem(
                              getFirstInSubject(
                                selectedCategory,
                                section,
                                subject
                              )!
                            )}
                          >
                            {subject}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="questions">
          <ul>
            {questions?.map((item) => (
              <li
                key={item.question}
                data-active={item.question === selectedQuestion}
              >
                <div className="question-title">
                  <a
                    data-question={item.question}
                    onClick={(evt) => {
                      evt.preventDefault();
                      navigateFaqItem(
                        getQuestion(
                          selectedCategory,
                          selectedSection,
                          selectedSubject,
                          item.question
                        )!
                      );
                    }}
                    href={getUrlFromFaqItem(
                      getQuestion(
                        selectedCategory,
                        selectedSection,
                        selectedSubject,
                        item.question
                      )!
                    )}
                  >
                    {item.question}
                  </a>
                </div>
                <div className="question-answer">{item.answer}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
