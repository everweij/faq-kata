import { useState } from "react";
import type { FaqItem } from "./data";

interface SearchInputProps {
  faqItems: FaqItem[];
  onSubmit: (item: FaqItem) => void;
  getFaqUrl: (item: FaqItem) => string;
}

export function SearchInput({
  faqItems,
  onSubmit,
  getFaqUrl
}: SearchInputProps) {
  const [value, setValue] = useState("");

  const autoCompleteItems =
    value &&
    faqItems.filter((item) =>
      item.question.toLowerCase().includes(value.toLowerCase())
    );

  return (
    <header>
      <label>
        Search
        <div className="search-input-wrapper">
          <input
            value={value}
            onChange={({ currentTarget: { value } }) =>
              setValue(value.trimStart())
            }
            type="search"
          />
          {autoCompleteItems && (
            <ul className="autocomplete">
              {autoCompleteItems.map((item) => (
                <li key={item.id}>
                  <a
                    data-question={item.question}
                    onClick={(evt) => {
                      evt.preventDefault();
                      setValue("");
                      onSubmit(item);
                    }}
                    href={getFaqUrl(item)}
                  >
                    {item.question}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>
    </header>
  );
}
