import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Select from 'react-select';
import api from '../../services/api';
import Container from '../../components/Container';

import { Loading, Owner, IssueList, Buttons, SubmitButton } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    searching: false,
    state: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'all',
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleFilterChange = async e => {
    this.setState({
      state: e.value,
      searching: true,
    });

    const { repository, state } = this.state;

    const response = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state,
        per_page: 5,
      },
    });

    this.setState({
      issues: response.data,
      searching: false,
    });
  };

  handlePageChange = async action => {
    const { page } = this.state;
    const newPage = action === 'back' ? page - 1 : page + 1;
    const { repository, state } = this.state;

    this.setState({
      searching: true,
    });

    const response = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state,
        page: newPage,
        per_page: 5,
      },
    });

    this.setState({
      issues: response.data,
      page: newPage,
      searching: false,
    });
  };

  render() {
    const { repository, issues, loading, searching, page } = this.state;

    const options = [
      { value: 'all', label: 'All issues' },
      { value: 'open', label: 'Open issues' },
      { value: 'closed', label: 'Closed issues' },
    ];
    const defaultOption = options[0];

    if (loading) {
      return <Loading>Loading</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Back to repository list</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <Select
          options={options}
          defaultValue={defaultOption}
          onChange={this.handleFilterChange}
        />

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Buttons>
          <SubmitButton
            loading={searching}
            disabled={page < 2}
            onClick={() => this.handlePageChange('back')}
          >
            Previous Page
          </SubmitButton>
          <strong>Page {page}</strong>
          <SubmitButton
            loading={searching}
            disabled={issues.length === 0}
            onClick={() => this.handlePageChange('next')}
          >
            Next Page
          </SubmitButton>
        </Buttons>
      </Container>
    );
  }
}
