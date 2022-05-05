<template>
  <div class="IVSH_REGIONS">
    <div class="IVSH_REGION" v-for="(IVSHMEM_VMO, index) in modelValue">
      <div class="IVSH_REGION_CONTENT">
        <b style="margin-bottom: 2rem">InterVM shared memory region {{ index + 1 }}</b>

        <table style="padding: 2rem 0 0 0">
          <tbody>
          <tr>
            <td>
              <label>Region name: </label>
            </td>
            <td><input v-model="IVSHMEM_VMO.NAME"/></td>
          </tr>
          <tr>
            <td>
              <label>Emulated by: </label>
            </td>
            <td><input v-model="IVSHMEM_VMO.PROVIDED_BY"/></td>
          </tr>
          <tr>
            <td>
              <label>Size (MB):  </label>
            </td>
            <td><input v-model="IVSHMEM_VMO.IVSHMEM_SIZE"/></td>
          </tr>
          </tbody>
        </table>

        <div style="padding: 2rem 2rem 1rem 0">
          <b>Shared VMs</b>
          <p>Select all VMs that will use this shared memory region</p>
          <table>
            <thead>
            <tr>
              <th></th>
              <td>Virtual BDF</td>
            </tr>
            </thead>
            <tbody>
            <tr v-for="IVSHMEM_VM in IVSHMEM_VMO.IVSHMEM_VMS.IVSHMEM_VM">
              <td>
                VM name:
                <b-form-select>
                  <b-form-select-option>
                    {{ IVSHMEM_VM.VM_NAME }}
                  </b-form-select-option>
                </b-form-select>
              </td>
              <td>
                <label>Emulated by: <input v-model="IVSHMEM_VM.VBDF"/></label>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="ToolSet">
        <Icon size="18px" @click="removeThisVMO">
          <Minus/>
        </Icon>
        <Icon size="18px" @click="addIVSHMEM_VMO">
          <Plus/>
        </Icon>
      </div>

    </div>

  </div>
</template>

<script>
import _ from 'lodash';
import {Icon} from "@vicons/utils";
import {Plus, Minus} from '@vicons/fa'
import {BFormSelect, BFormSelectOption} from "bootstrap-vue-3";

export default {
  name: "IVSHMEM_REGION",
  components: {BFormSelectOption, BFormSelect, Icon, Plus, Minus},
  props: {
    modelValue: {
      type: null,
      default: ''
    },
  }, methods: {
    removeThisVMO(index) {
      this.modelValue.splice(index, 1);
    },
    addIVSHMEM_VMO() {
      if (!_.isArray(this.modelValue)) {
        this.modelValue = []
      }
      this.modelValue.push({
        "NAME": "shm_region_" + this.modelValue.length,
        "PROVIDED_BY": "Hypervisor",
        "IVSHMEM_SIZE": "2",
        "IVSHMEM_VMS": {
          "IVSHMEM_VM": [
            {
              "VM_NAME": "PRE_RT_VM0",
              "VBDF": ""
            },
            {
              "VM_NAME": "POST_STD_VM1",
              "VBDF": ""
            }
          ]
        }
      })
    }
  }
}
</script>

<style scoped>
label {
  display: block;
}

.IVSH_REGION {
  display: flex;
  align-items: start;
}

.IVSH_REGION_CONTENT {
  border: 1px solid gray;
  border-radius: 5px;
  padding: 25px;
  margin: 1rem 0 2rem;
}

.ToolSet {
  margin: 1rem 0 2rem;
  padding: 0 1rem;
}
.xicon{
  margin: 8px;
  border: 1px solid gray;
  border-radius: 3px;
  background: lightgray;
}
</style>