import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { Search, X } from "lucide-react";
import styles from "../../admin/admin.module.css";

export default function SearchBar({
  placeholder = "جستجو...",
  value,
  onChange,
  autoFocus = false,
  debounceMs = 250,
  className = "",
}) {
  const [internal, setInternal] = useState(value ?? "");

  useEffect(() => {
    setInternal(value ?? "");
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => onChange?.(internal), debounceMs);
    return () => clearTimeout(id);
  }, [internal, debounceMs, onChange]);

  const clear = () => {
    setInternal("");
    onChange?.("");
  };

  return (
    <TextField
      autoFocus={autoFocus}
      className={`${styles.searchField} ${className || ""}`}
      value={internal}
      onChange={(e) => setInternal(e.target.value)}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      fullWidth
      inputProps={{ dir: "auto" }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search size={18} className={styles.searchAdornmentIcon} />
          </InputAdornment>
        ),
        endAdornment: internal ? (
          <InputAdornment position="end">
            <IconButton aria-label="clear" size="small" onClick={clear}>
              <X size={18} className={styles.searchAdornmentIcon} />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
}