import {
  MerakiOrganization,
  MerakiNetwork,
  MerakiVlan,
  MerakiAdminUser,
  MerakiDevice,
  MerakiSamlRole,
  MerakiSSID,
} from '../collector';
import {
  createIntegrationEntity,
  convertProperties,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';
import createEntityKey from './utils/createEntityKey';
import { Entities } from '../constants';

export const convertAccount = (
  data: MerakiOrganization,
): ReturnType<typeof createIntegrationEntity> =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        _key: createEntityKey(Entities.ORGANIZATION._type, data.name),
        _type: Entities.ACCOUNT._type,
        _class: Entities.ACCOUNT._class,
        name: data.name,
        displayName: `${data.name} Cisco Meraki Dashboard`,
      },
    },
  });

export const convertOrganization = (
  data: MerakiOrganization,
): ReturnType<typeof createIntegrationEntity> =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        _key: createEntityKey(Entities.ORGANIZATION._type, data.id),
        _type: Entities.ORGANIZATION._type,
        _class: Entities.ORGANIZATION._class,
        id: data.id,
        name: data.name,
        displayName: data.name,
        url: data.url,
      },
    },
  });

export const convertAdminUser = (
  data: MerakiAdminUser,
): ReturnType<typeof createIntegrationEntity> =>
  createIntegrationEntity({
    // TODO: @zemberdotnet
    // `data.tags: string[]`
    // We need to test that the tags supplied by the API will work with the
    // J1 Tagging system. Based on current typings from example responses from the
    // docs, the tags are incompatible. However, I'm not sure this is completely
    // true and should be tested manually with a real response. If incompatible,
    // apply transformations to the tags to make them compatible.
    entityData: {
      source: {
        ...data,
        tags: [],
      },
      assign: {
        _key: createEntityKey(Entities.ADMIN._type, data.id),
        _type: Entities.ADMIN._type,
        _class: Entities.ADMIN._class,
        name: data.name,
        displayName: data.name,
        admin: true,
        mfaEnabled: data.twoFactorAuthEnabled,
        lastActive: parseTimePropertyValue(data.lastActive),
        username: data.email,
        id: data.id,
        email: data.email,
        authenticationMethod: data.authenticationMethod,
        orgAccess: data.orgAccess,
        accountStatus: data.accountStatus,
        // TODO: @zemberdotnet
        // active: accountStatus == "ok"?
        twoFactorAuthEnabled: data.twoFactorAuthEnabled,
        hasApiKey: data.hasApiKey,
      },
    },
  });

export const convertSamlRole = (
  data: MerakiSamlRole,
): ReturnType<typeof createIntegrationEntity> =>
  createIntegrationEntity({
    // TODO: @zemberdotnet
    // We need to test that the tags supplied by the API will work with the
    // J1 Tagging system. Based on current typings from example responses from the
    // docs, the tags are incompatible. However, I'm not sure this is completely
    // true and should be tested manually with a real response. If incompatible,
    // apply transformations to the tags to make them compatible.
    // alternatively, we should look at changes in the sdk
    entityData: {
      source: {
        ...data,
        tags: [],
      },
      assign: {
        _key: createEntityKey(Entities.SAML_ROLE._type, data.id),
        _type: Entities.SAML_ROLE._type,
        _class: Entities.SAML_ROLE._class,
        name: data.role,
        displayName: data.role,
        id: data.id,
        role: data.role,
        orgAccess: data.orgAccess,
      },
    },
  });

export const convertNetwork = (
  data: MerakiNetwork,
): ReturnType<typeof createIntegrationEntity> => {
  const networkEntity = createIntegrationEntity({
    // TODO: @zemberdotnet
    // We need to test that the tags supplied by the API will work with the
    // J1 Tagging system. Based on current typings from example responses from the
    // docs, the tags are incompatible. However, I'm not sure this is completely
    // true and should be tested manually with a real response. If incompatible,
    // apply transformations to the tags to make them compatible.
    // alternatively, we should look at changes in the sdk
    entityData: {
      source: {
        ...data,
        tags: [],
      },
      assign: {
        _key: createEntityKey(Entities.NETWORK._type, data.id),
        _type: Entities.NETWORK._type,
        _class: Entities.NETWORK._class,
        id: data.id,
        name: data.name,
        displayName: data.name,
        organizationId: data.organizationId,
        timeZone: data.timeZone,
        notes: data.notes,
        type: getNetworkType(data),
        productTypes: data.productTypes,
      },
    },
  });
  // HACK: The integration SDK removes tag properties and converts them
  // however this used to use convert properties and had tags
  // this is here for continuity
  if (data.tags?.length > 0) {
    networkEntity.tags = data.tags;
  }
  return networkEntity;
};

export const convertSSID = (
  data: MerakiSSID,
  networkId: string,
): ReturnType<typeof createIntegrationEntity> =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        ...convertProperties(data),
        _key: createEntityKey(
          Entities.WIFI._type,
          `${networkId}:${data.number}:${data.name}`,
        ),
        _type: Entities.WIFI._type,
        _class: Entities.WIFI._class,
        name: data.name,
        displayName: data.name,
        type: 'wireless',
        encrypted: !!data.encryptionMode,
        public: data.authMode === 'open',
        internal: data.authMode !== 'open',
        guest: !!data.name.match(/guest/i),
        CIDR: null, // CIDR is required by data model
      },
    },
  });

export const convertVlan = (
  data: MerakiVlan,
): ReturnType<typeof createIntegrationEntity> =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        _key: createEntityKey(
          Entities.VLAN._type,
          `${data.networkId}:${data.id}`,
        ),
        _type: Entities.VLAN._type,
        _class: Entities.VLAN._class,
        id: `${data.networkId}:${data.id}`,
        vlanId: data.id,
        name: data.name,
        displayName: data.name,
        CIDR: data.subnet,
        defaultGateway: data.applianceIp,
        internal: true,
        dmz: !!data.name.match(/dmz/i),
        public: !!data.name.match(/dmz|public/i),
        wireless: !!data.name.match(/wireless|wifi/i),
        networkId: data.networkId,
        applianceIp: data.applianceIp,
        subnet: data.subnet,
        dnsNameservers: data.dnsNameservers,
        dhcpHandling: data.dhcpHandling,
        dhcpLeaseTime: data.dhcpLeaseTime,
        dhcpBootOptionsEnabled: data.dhcpBootOptionsEnabled,
      },
    },
  });

export const convertDevice = (
  data: MerakiDevice,
): ReturnType<typeof createIntegrationEntity> => {
  const deviceEntity = createIntegrationEntity({
    // TODO: @zemberdotnet
    // We need to test that the tags supplied by the API will work with the
    // J1 Tagging system. Based on current typings from example responses from the
    // docs, the tags are incompatible. However, I'm not sure this is completely
    // true and should be tested manually with a real response. If incompatible,
    // apply transformations to the tags to make them compatible.
    // alternatively, we should look at changes in the sdk

    entityData: {
      source: {
        ...data,
        tags: [],
      },
      assign: {
        _key: createEntityKey(
          Entities.DEVICE._type,
          `${data.networkId}:${data.mac || data.serial}`,
        ),
        _type: Entities.DEVICE._type,
        _class: Entities.DEVICE._class,
        category: 'network',
        make: 'Cisco Meraki',
        name: data.name ?? data.networkId,
        displayName: data.name ?? data.networkId,
        hostname: data.name,
        macAddress: data.mac,
        ipAddress: data.lanIp ? data.lanIp : undefined,
        privateIp: data.lanIp ? data.lanIp : undefined,
        privateIpAddress: data.lanIp ? data.lanIp : undefined,
        publicIp: getPublicIp(data),
        publicIpAddress: getPublicIp(data),
        deviceId: null, // data-model required property

        serial: data.serial,
        lat: data.lat,
        lng: data.lng,
        latitude: data.lat,
        longitude: data.lng,
        address: data.address,
        mac: data.mac,
        firmware: data.firmware,
        networkId: data.networkId,
        floorPlanId: data.floorPlanId,

        url: data.url,
        webLink: data.url,

        notes: data.notes,

        lanIp: data.lanIp,
        wanIp: data.wanIp,
        wan1Ip: data.wan1Ip,
        wan2Ip: data.wan2Ip,
      },
    },
  });
  // HACK: The integration SDK removes tag properties and converts them
  // however this used to use convert properties and had tags
  // this is here for continuity

  if (data.tags?.length > 0) {
    deviceEntity.tags = data.tags;
  }
  return deviceEntity;
};

function getPublicIp(data: MerakiDevice): string | undefined {
  if (data.wanIp) {
    return data.wanIp;
  }
  if (data.wan1Ip) {
    return data.wan1Ip;
  }
  if (data.wan2Ip) {
    return data.wan2Ip;
  }
  return undefined;
}

export function getNetworkType(data: MerakiNetwork): string {
  if (!data.productTypes || data.productTypes.length === 0) {
    return 'unknown';
  } else if (data.productTypes.length === 1) {
    return data.productTypes[0];
  } else {
    return 'combined';
  }
}
