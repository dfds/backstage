/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { FC, useState } from 'react';
import { BackstageTheme } from '@backstage/theme';
import {
  Button,
  FormControl,
  FormHelperText,
  LinearProgress,
  MenuItem,
  InputLabel,
  Select,
  TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Controller, useForm } from 'react-hook-form';
import { ComponentIdValidators } from '../../util/validate';

const useStyles = makeStyles<BackstageTheme>(theme => ({
  form: {
    alignItems: 'flex-start',
    display: 'flex',
    flexFlow: 'column nowrap',
  },
  submit: {
    marginTop: theme.spacing(1),
  },
  select: {
    minWidth: 120,
  },
}));

export type Props = {
  onSubmit: (formData: Record<string, string>) => Promise<void>;
  submitting?: boolean;
};

export const RegisterComponentForm: FC<Props> = ({ onSubmit, submitting }) => {
  const { register, handleSubmit, errors, formState, setValue, control } = useForm({
    mode: 'onChange',
  });
  const classes = useStyles();
  const hasErrors = !!errors.componentLocation;
  const dirty = formState?.isDirty;
  const initialLocationSelection = "github";

  React.useEffect(() => {
    register("locationSelection");
    setValue("locationSelection", initialLocationSelection);
  }, [register]);


  // @ts-ignore
  const [locationSelection, setLocationSelection] = useState(initialLocationSelection);

  // Makes sure internal state is updated to reflect changes in UI and react-hook-form receives the new value
  // @ts-ignore
  const handleLocationSelectionChange = (event: any) => {
    setLocationSelection(event.target.value);
    setValue("locationSelection", event.target.value);
  };

  return submitting ? (
    <LinearProgress data-testid="loading-progress" />
  ) : (
    <form
      autoComplete="off"
      onSubmit={handleSubmit(onSubmit)}
      className={classes.form}
      data-testid="register-form"
    >
      <FormControl>
        <TextField
          id="registerComponentInput"
          variant="outlined"
          label="Entity file URL"
          data-testid="componentLocationInput"
          error={hasErrors}
          placeholder="https://example.com/user/some-service/blob/master/catalog-info.yaml"
          name="componentLocation"
          required
          margin="normal"
          helperText="Enter the full path to the catalog-info.yaml file in GitHub, GitLab, Bitbucket or Azure to start tracking your component."
          inputRef={register({
            required: true,
            validate: ComponentIdValidators,
          })}
        />

        {errors.componentLocation && (
          <FormHelperText error={hasErrors} id="register-component-helper-text">
            {errors.componentLocation.message}
          </FormHelperText>
        )}
      </FormControl>

      {/* <FormControl>
        <InputLabel id="registerComponentLocationSelection-label">Location</InputLabel>
        <Select
          labelId="registerComponentLocationSelection-label"
          id="registerComponentLocationSelection"
          required
          displayEmpty
          name="componentLocationSelection"
          value={locationSelection}
          onChange={handleLocationSelectionChange}
        >
            <MenuItem value={"github"}>GitHub</MenuItem>
            <MenuItem value={"github/api"}>GitHub - Private repos</MenuItem>
            <MenuItem value={"azuredevops"}>Azure DevOps</MenuItem>
          </Select>
      </FormControl> */}

      <FormControl variant="outlined" className={classes.select}>
        <InputLabel id="scmLabel">Host type</InputLabel>
        <Controller
          control={control}
          name="scmType"
          defaultValue="AUTO"
          render={({ onChange, onBlur, value }) => (
            <Select
              labelId="scmLabel"
              id="scmSelect"
              label="scmLabel"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            >
              <MenuItem value="AUTO">Auto-detect</MenuItem>
              <MenuItem value={"github"}>GitHub</MenuItem>
              <MenuItem value={"github/api"}>GitHub - Private repos</MenuItem>
              <MenuItem value="gitlab">GitLab</MenuItem>
              <MenuItem value="bitbucket/api">Bitbucket</MenuItem>
              <MenuItem value="azure/api">Azure</MenuItem>
              <MenuItem value={"azuredevops"}>Azure DevOps</MenuItem>
            </Select>
          )}
        />
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        type="submit"
        disabled={!dirty || hasErrors}
        className={classes.submit}
      >
        Submit
      </Button>
    </form>
  );
};
