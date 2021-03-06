import React from 'react'
import {
  Container,
  Card,
  CardImg,
  CardBody,
  CardSubtitle,
  CardTitle,
  CardText,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Input,
  InputGroup,
  InputGroupButton,
} from 'reactstrap'
import styled from 'styled-components'
import request from '../../utils/request'

const Wrapper = styled(Container)`
  max-width: 700px !important;
  margin: 40px auto;

  h2.title-profile {
    margin-bottom: 30px;
  }

  button {
    cursor: pointer;
  }
`

const UserAvatar = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;

  img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`

const UserName = styled.span`
  font-size: 24px;
  font-weight: bold;
  display: inline-block;
  margin: 0 10px 20px 0;
`

const UserBio = styled.p`
  font-size: 16px;
  line-height: 1.5;
`

const CenterButton = styled(Row)`
  justify-content: center;
`

function convertDate(str) {
  const d = (new Date(str)).toString().split(' ')
  return `${d[1]} ${d[2]} ${d[3]}`
}

class Traveller extends React.Component {
  constructor(props) {
    super(props)
    const locationState = props.location.state
    this.state = {
      plans: [],
      userAvatar: locationState ? locationState.userAvatar : 'https://s3.amazonaws.com/uifaces/faces/twitter/mlane/128.jpg',
      userName: locationState ? locationState.userName : localStorage.fullName,
      userBio: locationState ? locationState.userBio : 'I\'ve lived in Tokyo for more than ten years, working in the fashion industry and running Tokyo Fashionista Events. This has given me many connections to amazing people and great nightlife experiences, and I\'m excited to share them both with you.',
      modal: false,
      currentPlan: '',
      eth: 0,
    }

    this.ethToDeposit = this.ethToDeposit.bind(this)
    this.gotoEdit = this.gotoEdit.bind(this)
    this.gotoCreatePlan = this.gotoCreatePlan.bind(this)
    this.joinPlan = this.joinPlan.bind(this)
    this.startPlan = this.startPlan.bind(this)
    this.toggleModal = this.toggleModal.bind(this)
  }

  componentDidMount() {
    request(`${localStorage.origin}/api/v1/plans`, {
      method: 'GET',
    }).then((result) => {
      this.setState({
        plans: result.filter(rs => rs.onwer !== localStorage.owner),
      })
    })

    window.contract.deployed()
    .then((instance) => instance.PlanStarted(null, { fromBlock: 0, toBlock: 'latest'}))
    .then((rs) => console.log(rs))
  }

  gotoEdit() {
    this.props.history.push('/traveller/edit', {
      ...this.state,
    })
  }

  gotoCreatePlan() {
    this.props.history.push('/plan/create')
  }

  toggleModal(planId) {
    this.setState((prevState) => ({
      currentPlan: planId,
      modal: !prevState.modal,
    }))
  }

  ethToDeposit(value) {
    this.setState({ eth: value })
  }

  joinPlan() {
    const eth = this.state.eth
    request(`${localStorage.origin}/api/v1/plan/add-trip-mate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripMate: localStorage.owner || '',
        id: this.state.currentPlan,
      }),
    }).then((result) => {
      console.log(result)
      window.contract.deployed()
        .then((instance) => {
          return instance.joinPlan(result._id, {
            from: '0xEdaF7259cADb03a7e3C3DC5cA9a69A9A2bd17681',
            to: instance.address,
            gas: 300000,
            value: window.web3.toWei(eth, 'ether'),
          })
        })
    })
  }

  startPlan(planId) {
    const eth = this.state.eth
    window.contract.deployed()
      .then((instance) => {
        return instance.startPlan(planId, {
          from: '0xEdaF7259cADb03a7e3C3DC5cA9a69A9A2bd17681',
          to: instance.address,
          gas: 300000,
        })
        // return instance.startPlan(planId)
      })
      .then((rs) => console.log(rs))
  }

  render() {
    const {
      userAvatar,
      userName,
      userBio,
    } = this.state

    return (
      <Wrapper>
        <h2 className="title-profile">Traveller Profile</h2>
        <Row>
          <Col xs="12" sm="2">
            <UserAvatar>
              <img src={userAvatar} alt={userName}/>
            </UserAvatar>
          </Col>
          <Col xs="12" sm="10">
            <UserName>{userName}</UserName>{' '}
            <Button
              outline
              color="secondary"
              onClick={this.gotoEdit}
            >
              Edit
            </Button>
            <UserBio>{userBio}</UserBio>
          </Col>
        </Row>
        <CenterButton>
          <Button
            color="primary"
            onClick={this.gotoCreatePlan}
          >
            Create Your Plan
          </Button>
        </CenterButton>

        <h3>My Plans</h3>
        <Row>
          { this.state.plans && this.state.plans
              .filter((plan) => localStorage.owner === plan.owner)
              .map((plan, index) => (
                <Col key={index} sm="4" style={{ marginTop: 20 }}>
                  <Card>
                    <CardImg top width="100%" src={plan.calendar.destination.image || ''} alt="Card image cap" />
                    <CardBody>
                      <CardTitle>{plan.calendar.destination.name || ''}</CardTitle>
                      <CardText>From: {convertDate(plan.calendar.from)}</CardText>
                      <Button onClick={() => this.startPlan(plan._id)}>Start plan</Button>
                    </CardBody>
                  </Card>
                </Col>
              ))
          }
        </Row>

        <br />

        <h3>Other Plans</h3>
        <Row>
          { this.state.plans && this.state.plans
              .filter((plan) => localStorage.owner !== plan.owner)
              .map((plan, index) => (
                <Col key={index} sm="4" style={{ marginTop: 20 }}>
                  <Card>
                    <CardImg top width="100%" src={plan.calendar.destination.image || ''} alt="Card image cap" />
                    <CardBody>
                      <CardTitle>{plan.calendar.destination.name || ''}</CardTitle>
                      <CardText>From: {convertDate(plan.calendar.from)}</CardText>
                      <Button onClick={() => this.toggleModal(plan._id)}>Join</Button>
                    </CardBody>
                  </Card>
                </Col>
              ))
          }
        </Row>

        <Modal isOpen={this.state.modal} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggle}>Join Plan</ModalHeader>
          <ModalBody>
            <InputGroup>
              <Input placeholder="ex: 1 ETH" onChange={(ev) => this.ethToDeposit(ev.target.value)} />
              <InputGroupButton>
                <Button onClick={() => this.joinPlan()}>Deposit</Button>
              </InputGroupButton>
            </InputGroup>
          </ModalBody>
        </Modal>
      </Wrapper>
    )
  }
}

export default Traveller
